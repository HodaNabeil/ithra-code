import type { AskTutorInputDTO, AskTutorResultDTO } from '../dto/ask-tutor.dto';
import {
  buildTutorSessionContext,
  type CourseContextServiceDeps,
} from '../services/course-context.service';
import { retrieveRelevantContent } from '../services/content-retriever.service';
import {
  buildConversationMessages,
  buildPromptPreview,
  buildSystemPrompt,
  getTutorBasePromptVersion,
} from '../services/prompt-builder';
import {
  buildNoResultsMessage,
  mapChunksToSources,
} from '../services/rag-helpers';
import {
  buildGuidedLearningResponse,
  detectAssessmentIntent,
} from '../services/educational-integrity.service';
import { detectSessionMetaIntent } from '../services/student-info.service';
import {
  buildSuggestionFallback,
  formatSuggestionMessage,
} from '../services/content-suggestion.service';
import { updateLearningProfileFromInteraction } from '../services/learning-profile.service';
import { AskTutorError, AskTutorErrorCodes } from '../errors/ask-tutor.errors';
import type { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import { ConversationRepositoryError } from '../../domain/ports/ConversationRepositoryPort';
import { LlmError, type LlmPort } from '../../domain/ports/LlmPort';
import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { VectorSearchPort } from '../../domain/ports/VectorSearchPort';
import { VectorSearchError } from '../../domain/ports/VectorSearchPort';
import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import type { VectorSearchConfig } from '../services/content-retriever.service';
import type { MessageSourceDTO } from '../dto/message-source.dto';
import type { RetrievedContentChunk } from '../dto/retrieved-content.dto';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import { env } from '@/config/env';
import { streamAgent } from '@/ai-platform';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import type { RetrievedChunkState } from '@/ai-platform/graph/state/tutor-agent.state';
import { PlatformError } from '@/ai-platform/shared/errors';
import { checkTutorDailyCostCap } from '../../infrastructure/guards/tutor-cost-cap.guard';
import { checkTutorMessageRateLimit } from '../../infrastructure/guards/tutor-request.guards';
import { mapPlatformErrorToAskTutorError } from '../../infrastructure/guards/platform-error.mapper';
import type { TutorSessionContext } from '../../domain/models/TutorSessionContext';

export type AskTutorUseCaseDeps = CourseContextServiceDeps & {
  llmPort: LlmPort;
  conversationRepository: ConversationRepositoryPort;
  embeddingPort: EmbeddingPort;
  vectorSearchPort: VectorSearchPort;
  contentFilter: ContentFilterPort;
  vectorSearchConfig?: VectorSearchConfig;
};

export type AskTutorRequestOutcome = {
  usedFallback: boolean;
  filterTriggered: boolean;
  assessmentBlocked: boolean;
  retrievalChunkCount: number;
};

function encodeStreamMeta(meta: {
  sources: ReturnType<typeof mapChunksToSources>;
  usedFallback: boolean;
  educationalFilterApplied?: boolean;
}): string {
  return `${AI_TUTOR_CONSTANTS.SSE_META_PREFIX}${JSON.stringify(meta)}`;
}

function withSuggestions(
  baseMessage: string,
  question: string,
  lectures: Parameters<typeof buildSuggestionFallback>[1],
  excludeLectureId?: string,
): string {
  const { formattedMessage } = buildSuggestionFallback(question, lectures, {
    excludeLectureId,
  });

  if (!formattedMessage) {
    return baseMessage;
  }

  return `${baseMessage}\n\n${formattedMessage}`;
}

async function persistCompletedTurn(
  conversationRepository: ConversationRepositoryPort,
  threadId: string,
  userContent: string,
  assistantContent: string,
  sources?: MessageSourceDTO[],
): Promise<void> {
  await conversationRepository.persistTurn(threadId, {
    userContent,
    assistantContent,
    retrievedSources: sources,
  });
}

async function runRuntimeEarlyExitGuards(userId: string): Promise<void> {
  await checkTutorMessageRateLimit(userId);
  await checkTutorDailyCostCap();
}

function mapChunksToRetrievedChunkState(
  chunks: RetrievedContentChunk[],
): RetrievedChunkState[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    score: chunk.score,
    metadata: {
      ...chunk.metadata,
      title: chunk.title,
      contentType: chunk.contentType,
      lectureId: chunk.lectureId,
    },
  }));
}

async function* streamTutorViaPlatformRuntime(input: {
  userId: string;
  question: string;
  sessionContext: TutorSessionContext;
  lectureId?: string;
  threadId: string;
  conversationId: string;
  systemPrompt: string;
  messages: ReturnType<typeof buildConversationMessages>;
  retrievedChunks: RetrievedContentChunk[];
  strictMode: boolean;
}): AsyncGenerator<string, string> {
  let assistantResponse = '';

  try {
    for await (const event of streamAgent('tutor', {
      userId: input.userId,
      input: input.question,
      locale: 'ar',
      scope: {
        userId: input.userId,
        courseId: input.sessionContext.courseId,
        lectureId: input.lectureId,
        threadId: input.threadId,
        conversationId: input.conversationId,
      },
      options: {
        maxTokens: AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS,
        metadata: {
          systemPrompt: input.systemPrompt,
          conversationHistory: input.messages,
          retrievedChunks: mapChunksToRetrievedChunkState(input.retrievedChunks),
          promptVersion: getTutorBasePromptVersion(),
        },
      },
    })) {
      if (event.type === 'token') {
        assistantResponse += event.text;
        if (!input.strictMode) {
          yield event.text;
        }
      }

      if (event.type === 'error') {
        throw mapPlatformErrorToAskTutorError(event);
      }
    }
  } catch (error) {
    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
    }
    throw error;
  }

  return assistantResponse;
}

async function* streamTutorViaLegacyLlm(input: {
  llmPort: LlmPort;
  systemPrompt: string;
  messages: ReturnType<typeof buildConversationMessages>;
  strictMode: boolean;
}): AsyncGenerator<string, string> {
  const stream = input.llmPort.streamAnswer({
    systemPrompt: input.systemPrompt,
    messages: input.messages,
  });

  let assistantResponse = '';

  if (input.strictMode) {
    for await (const token of stream) {
      assistantResponse += token;
    }
  } else {
    for await (const token of stream) {
      assistantResponse += token;
      yield token;
    }
  }

  return assistantResponse;
}

export async function* askTutorUseCase(
  input: AskTutorInputDTO & { userId: string },
  deps: AskTutorUseCaseDeps,
): AsyncGenerator<string, AskTutorResultDTO & { outcome: AskTutorRequestOutcome }> {
  const {
    llmPort,
    conversationRepository,
    embeddingPort,
    vectorSearchPort,
    contentFilter,
  } = deps;

  let conversationId = '';
  let threadId = '';
  const outcome: AskTutorRequestOutcome = {
    usedFallback: false,
    filterTriggered: false,
    assessmentBlocked: false,
    retrievalChunkCount: 0,
  };

  try {
    const sessionContext = await buildTutorSessionContext(
      {
        courseSlug: input.courseSlug,
        userId: input.userId,
        lectureId: input.lectureId,
      },
      deps,
    );

    const topic =
      sessionContext.lecture?.title ??
      input.lectureTitle?.trim() ??
      'محادثة عامة';

    const conversation = await conversationRepository.getOrCreateConversation(
      sessionContext.courseId,
      input.userId,
    );
    conversationId = conversation.id;

    const thread = await conversationRepository.getOrCreateThread(
      conversation.id,
      topic,
      input.lectureId,
    );
    threadId = thread.id;

    const history = await conversationRepository.getThreadMessages(
      thread.id,
      AI_TUTOR_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
    );

    void updateLearningProfileFromInteraction(
      {
        userId: input.userId,
        courseId: sessionContext.courseId,
        question: input.question,
        recentMessages: history,
      },
      deps,
    ).catch((error) => {
      if (env.NODE_ENV === 'development') {
        console.warn('[AI_TUTOR_PROFILE] Failed to update learning profile', error);
      }
    });

    const assessmentIntent = detectAssessmentIntent(input.question);
    const sessionMetaIntent = detectSessionMetaIntent(input.question);

    if (assessmentIntent.isAssessmentSeeking) {
      if (AIPlatformConfig.isRuntimeEnabled()) {
        await runRuntimeEarlyExitGuards(input.userId);
      }

      outcome.assessmentBlocked = true;
      outcome.usedFallback = true;

      const guided = withSuggestions(
        buildGuidedLearningResponse(input.question),
        input.question,
        sessionContext.lectureCatalog,
        input.lectureId,
      );

      yield encodeStreamMeta({
        sources: [],
        usedFallback: true,
        educationalFilterApplied: true,
      });
      yield guided;

      await persistCompletedTurn(
        conversationRepository,
        thread.id,
        input.question,
        guided,
      );

      return {
        threadId,
        conversationId,
        sources: [],
        usedFallback: true,
        outcome,
      };
    }

    const retrieval = await retrieveRelevantContent(
      {
        question: input.question,
        courseId: sessionContext.courseId,
        lectureId: input.lectureId,
        lectureTitle:
          sessionContext.lecture?.title ?? input.lectureTitle?.trim(),
        courseTitle: sessionContext.course.title,
        recentHistory: history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      },
      {
        embeddingPort,
        vectorSearchPort,
        vectorSearchConfig: deps.vectorSearchConfig,
      },
    );

    outcome.retrievalChunkCount = retrieval.chunks.length;
    outcome.usedFallback = retrieval.usedFallback;

    const sources = mapChunksToSources(retrieval.chunks);
    const streamMeta = {
      sources,
      usedFallback: retrieval.usedFallback,
      educationalFilterApplied: false,
    };

    yield encodeStreamMeta(streamMeta);

    if (retrieval.usedFallback && !sessionMetaIntent.isSessionMeta) {
      if (AIPlatformConfig.isRuntimeEnabled()) {
        await runRuntimeEarlyExitGuards(input.userId);
      }

      const fallbackMessage = buildNoResultsMessage(input.question, {
        lectures: sessionContext.lectureCatalog,
        excludeLectureId: input.lectureId,
        knowledgeIndexed: sessionContext.course.knowledgeIndexed,
      });

      yield fallbackMessage;

      await persistCompletedTurn(
        conversationRepository,
        thread.id,
        input.question,
        fallbackMessage,
      );

      return {
        threadId,
        conversationId,
        sources: [],
        usedFallback: true,
        outcome,
      };
    }

    const hasAssessmentAdjacentContent = retrieval.chunks.some((chunk) => {
      const metadata = chunk.metadata ?? {};
      return (
        metadata.isAssessment === true ||
        metadata.sensitivity === 'ASSESSMENT' ||
        String(chunk.contentType).toUpperCase().includes('QUIZ') ||
        String(chunk.contentType).toUpperCase().includes('ASSIGNMENT')
      );
    });

    const promptOptions = {
      assessmentMode: hasAssessmentAdjacentContent,
      sessionMetaMode: sessionMetaIntent.isSessionMeta && retrieval.usedFallback,
      currentQuestion: input.question,
    };
    const systemPrompt = buildSystemPrompt(
      sessionContext,
      retrieval.chunks,
      promptOptions,
    );
    const messages = buildConversationMessages(
      history,
      sessionContext,
      retrieval.chunks,
      promptOptions,
    );

    if (env.NODE_ENV === 'development') {
      const preview = buildPromptPreview(
        sessionContext,
        retrieval.chunks,
        promptOptions,
      );
      console.info('[AI_TUTOR_PROMPT]', {
        courseId: sessionContext.courseId,
        lectureId: sessionContext.lectureId,
        estimatedSystemTokens: preview.estimatedSystemTokens,
        historyMessages: messages.length,
        studentName: sessionContext.student.displayName ?? 'unknown',
        learningLevel: sessionContext.student.learningLevel,
        completionPercentage: sessionContext.studentProgress.completionPercentage,
        knowledgeGaps: sessionContext.studentProgress.knowledgeGaps.length,
        learningProfile: sessionContext.learningProfile?.explanationDepth ?? 'none',
        retrievedChunks: retrieval.chunks.length,
        usedFallback: retrieval.usedFallback,
        sessionMetaIntent: sessionMetaIntent.confidence,
        topScore: retrieval.chunks[0]?.score ?? null,
        assessmentIntent: assessmentIntent.confidence,
      });
    }

    const strictMode = !sessionMetaIntent.isSessionMeta;
    const usePlatformRuntime = AIPlatformConfig.isRuntimeEnabled();

    const responseStream = usePlatformRuntime
      ? streamTutorViaPlatformRuntime({
          userId: input.userId,
          question: input.question,
          sessionContext,
          lectureId: input.lectureId,
          threadId: thread.id,
          conversationId: conversation.id,
          systemPrompt,
          messages,
          retrievedChunks: retrieval.chunks,
          strictMode,
        })
      : streamTutorViaLegacyLlm({
          llmPort,
          systemPrompt,
          messages,
          strictMode,
        });

    let assistantResponse = '';
    while (true) {
      const { value, done } = await responseStream.next();
      if (done) {
        assistantResponse = value ?? '';
        break;
      }
      yield value;
    }

    let finalResponse = assistantResponse.trim();

    if (finalResponse) {
      const validation = await contentFilter.validateResponse(
        finalResponse,
        {
          question: input.question,
          retrievedSources: retrieval.chunks.map((chunk) => ({
            content: chunk.content,
            metadata: chunk.metadata ?? {},
          })),
          courseId: sessionContext.courseId,
          lectureId: input.lectureId,
        },
        { strictMode, courseId: sessionContext.courseId },
      );

      if (!validation.isValid) {
        outcome.filterTriggered = true;

        const suggestions = formatSuggestionMessage(
          input.question,
          buildSuggestionFallback(
            input.question,
            sessionContext.lectureCatalog,
            { excludeLectureId: input.lectureId },
          ).suggestions,
        );

        finalResponse =
          validation.suggestedResponse ??
          (await contentFilter.transformToGuidance(finalResponse, {
            courseId: sessionContext.courseId,
            lectureId: input.lectureId,
            topic: sessionContext.lecture?.title,
            question: input.question,
          }));

        if (suggestions) {
          finalResponse = `${finalResponse}\n\n${suggestions}`;
        }
      }

      if (strictMode) {
        yield finalResponse;
      }

      await persistCompletedTurn(
        conversationRepository,
        thread.id,
        input.question,
        finalResponse,
        sources,
      );
    }

    return {
      threadId,
      conversationId,
      sources,
      usedFallback: retrieval.usedFallback,
      outcome,
    };
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
    }

    if (error instanceof VectorSearchError) {
      throw new AskTutorError(502, error.message, AskTutorErrorCodes.LLM_ERROR);
    }

    if (error instanceof LlmError) {
      throw new AskTutorError(502, error.message, AskTutorErrorCodes.LLM_ERROR);
    }

    if (error instanceof ConversationRepositoryError) {
      throw new AskTutorError(
        500,
        error.message,
        AskTutorErrorCodes.REPOSITORY_ERROR,
      );
    }

    throw new AskTutorError(
      500,
      'حدث خطأ أثناء معالجة سؤالك',
      AskTutorErrorCodes.UNKNOWN,
    );
  }
}

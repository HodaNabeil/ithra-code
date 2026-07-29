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
} from '../services/prompt-builder';
import {
  buildNoResultsMessage,
  mapChunksToSources,
} from '../services/rag-helpers';
import {
  buildGuidedLearningResponse,
  detectAssessmentIntent,
} from '../services/educational-integrity.service';
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
import { AI_TUTOR_CONSTANTS } from '../../shared';
import { env } from '@/config/env';

export type AskTutorUseCaseDeps = CourseContextServiceDeps & {
  llmPort: LlmPort;
  conversationRepository: ConversationRepositoryPort;
  embeddingPort: EmbeddingPort;
  vectorSearchPort: VectorSearchPort;
  contentFilter: ContentFilterPort;
  vectorSearchConfig?: VectorSearchConfig;
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

export async function* askTutorUseCase(
  input: AskTutorInputDTO & { userId: string },
  deps: AskTutorUseCaseDeps,
): AsyncGenerator<string, AskTutorResultDTO> {
  const {
    llmPort,
    conversationRepository,
    embeddingPort,
    vectorSearchPort,
    contentFilter,
  } = deps;

  let conversationId = '';
  let threadId = '';

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

    await conversationRepository.addMessage(thread.id, {
      threadId: thread.id,
      role: 'user',
      content: input.question,
    });

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

    // Task 7.1: Block direct assessment-answer requests with guided learning.
    if (assessmentIntent.isAssessmentSeeking) {
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

      await conversationRepository.addMessage(thread.id, {
        threadId: thread.id,
        role: 'assistant',
        content: guided,
      });

      return {
        threadId,
        conversationId,
        sources: [],
        usedFallback: true,
      };
    }

    const retrieval = await retrieveRelevantContent(
      {
        question: input.question,
        courseId: sessionContext.courseId,
        lectureId: input.lectureId,
      },
      {
        embeddingPort,
        vectorSearchPort,
        vectorSearchConfig: deps.vectorSearchConfig,
      },
    );

    const sources = mapChunksToSources(retrieval.chunks);
    const streamMeta = {
      sources,
      usedFallback: retrieval.usedFallback,
      educationalFilterApplied: false,
    };

    yield encodeStreamMeta(streamMeta);

    if (retrieval.usedFallback) {
      const fallbackMessage = buildNoResultsMessage(input.question, {
        lectures: sessionContext.lectureCatalog,
        excludeLectureId: input.lectureId,
      });

      yield fallbackMessage;

      await conversationRepository.addMessage(thread.id, {
        threadId: thread.id,
        role: 'assistant',
        content: fallbackMessage,
      });

      return {
        threadId,
        conversationId,
        sources: [],
        usedFallback: true,
      };
    }

    const promptOptions = { assessmentMode: false };
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
        completionPercentage: sessionContext.studentProgress.completionPercentage,
        knowledgeGaps: sessionContext.studentProgress.knowledgeGaps.length,
        learningProfile: sessionContext.learningProfile?.explanationDepth ?? 'none',
        retrievedChunks: retrieval.chunks.length,
        usedFallback: retrieval.usedFallback,
        topScore: retrieval.chunks[0]?.score ?? null,
        assessmentIntent: assessmentIntent.confidence,
      });
    }

    const stream = llmPort.streamAnswer({
      systemPrompt,
      messages,
    });

    let assistantResponse = '';

    for await (const token of stream) {
      assistantResponse += token;
      yield token;
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
        { strictMode: true, courseId: sessionContext.courseId },
      );

      if (!validation.isValid) {
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

        // Replace streamed leaky content with a guided correction notice.
        yield `\n\n---\n${finalResponse}`;
      }

      await conversationRepository.addMessage(thread.id, {
        threadId: thread.id,
        role: 'assistant',
        content: finalResponse,
        retrievedSources: sources,
      });
    }

    return {
      threadId,
      conversationId,
      sources,
      usedFallback: false,
    };
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
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

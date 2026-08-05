import type { AskTutorInputDTO, AskTutorResultDTO } from '../dto/ask-tutor.dto';
import {
  buildTutorSessionContext,
  type CourseContextServiceDeps,
} from '../services/course-context.service';
import { getTutorBasePromptVersion } from '../services/prompt-builder';
import {
  detectAssessmentIntent,
} from '../services/educational-integrity.service';
import {
  detectSessionMetaIntent,
  type SessionMetaIntent,
} from '../services/student-info.service';
import {
  buildSuggestionFallback,
  formatSuggestionMessage,
} from '../services/content-suggestion.service';
import { updateLearningProfileFromInteraction } from '../services/learning-profile.service';
import { AskTutorError, AskTutorErrorCodes } from '../errors/ask-tutor.errors';
import type {
  ConversationRepositoryPort,
  MessageDTO,
} from '../../domain/ports/ConversationRepositoryPort';
import { ConversationRepositoryError } from '../../domain/ports/ConversationRepositoryPort';
import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import { ContentFilterError } from '../../domain/ports/ContentFilterPort';
import type { MessageSourceDTO } from '../dto/message-source.dto';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import { streamAgent, type RetrievedSource } from '@/ai-platform';
import type { TutorPersonalizationContext } from '@/ai-platform/graph/state/tutor-agent.state';
import { PlatformError } from '@/ai-platform/shared/errors';
import { mapPlatformErrorToAskTutorError } from '../../infrastructure/guards/platform-error.mapper';
import type { TutorSessionContext } from '../../domain/models/TutorSessionContext';

export type AskTutorUseCaseDeps = CourseContextServiceDeps & {
  conversationRepository: ConversationRepositoryPort;
  contentFilter: ContentFilterPort;
};

export type AskTutorRequestOutcome = {
  usedFallback: boolean;
  filterTriggered: boolean;
  assessmentBlocked: boolean;
  retrievalChunkCount: number;
};

function encodeStreamMeta(meta: {
  sources: MessageSourceDTO[];
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

/**
 * Maps the feature-owned session context into the plain personalization
 * facts ai-platform accepts. ai-platform owns rendering these facts into the
 * final system prompt — this function must not build any prompt text itself.
 */
function buildPersonalizationContext(
  sessionContext: TutorSessionContext,
  sessionMetaIntent: SessionMetaIntent,
): TutorPersonalizationContext {
  return {
    studentName: sessionContext.student.displayName,
    learningLevel: sessionContext.student.learningLevel,
    courseTitle: sessionContext.course.title,
    progressPercent: sessionContext.studentProgress.completionPercentage,
    knowledgeGaps: sessionContext.studentProgress.knowledgeGaps.map(
      (gap) => gap.lectureTitle,
    ),
    sessionMetaMode: sessionMetaIntent.isSessionMeta,
  };
}

function mapPlatformSourcesToMessageSources(
  sources: RetrievedSource[],
): MessageSourceDTO[] {
  return sources.map((source) => {
    const metadata = source.metadata ?? {};
    const contentType = String(metadata.contentType ?? 'UNKNOWN');
    return {
      id: source.id,
      title: String(metadata.title ?? 'مصدر غير معروف'),
      source: contentType,
      relevanceScore: source.score,
      contentType,
      lectureId: typeof metadata.lectureId === 'string' ? metadata.lectureId : undefined,
    };
  });
}

/**
 * Streams a tutor turn via the ai-platform runtime. Retrieval and
 * system-prompt construction happen entirely inside the tutor graph
 * (retrieve-context.node.ts / tutor-system-prompt.builder.ts) — this
 * function only supplies raw conversation history and personalization
 * facts, and relays the resulting stream (including RAG source metadata)
 * back to the caller. This is the only tutor turn path — ai-platform owns
 * RAG, prompting, memory, and guardrails end-to-end.
 */
async function* streamTutorViaPlatformRuntime(input: {
  userId: string;
  question: string;
  sessionContext: TutorSessionContext;
  sessionMetaIntent: SessionMetaIntent;
  lectureId?: string;
  threadId: string;
  conversationId: string;
  history: MessageDTO[];
  conversationRepository: ConversationRepositoryPort;
  contentFilter: ContentFilterPort;
  outcome: AskTutorRequestOutcome;
}): AsyncGenerator<string, AskTutorResultDTO & { outcome: AskTutorRequestOutcome }> {
  const { outcome } = input;
  const strictMode = !input.sessionMetaIntent.isSessionMeta;
  const personalization = buildPersonalizationContext(
    input.sessionContext,
    input.sessionMetaIntent,
  );

  let sources: MessageSourceDTO[] = [];
  let rawSources: RetrievedSource[] = [];
  let assistantResponse = '';
  let streamedTokens = false;

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
          conversationHistory: input.history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          personalization,
          promptVersion: getTutorBasePromptVersion(),
        },
      },
    })) {
      if (event.type === 'meta' && event.sources) {
        rawSources = event.sources;
        sources = mapPlatformSourcesToMessageSources(event.sources);
        outcome.retrievalChunkCount = event.sources.length;
        outcome.usedFallback = event.usedFallback ?? false;

        yield encodeStreamMeta({
          sources,
          usedFallback: outcome.usedFallback,
          educationalFilterApplied: false,
        });
      }

      if (event.type === 'token') {
        assistantResponse += event.text;
        streamedTokens = true;
        if (!strictMode) {
          yield event.text;
        }
      }

      if (event.type === 'error') {
        throw mapPlatformErrorToAskTutorError(event);
      }
    }

    let finalResponse = assistantResponse.trim();

  const assessmentIntent = detectAssessmentIntent(input.question);
  if (assessmentIntent.isAssessmentSeeking) {
    outcome.assessmentBlocked = true;
    outcome.usedFallback = true;

    if (!streamedTokens && finalResponse) {
      yield encodeStreamMeta({
        sources: [],
        usedFallback: true,
        educationalFilterApplied: true,
      });
    }

    finalResponse = withSuggestions(
      finalResponse,
      input.question,
      input.sessionContext.lectureCatalog,
      input.lectureId,
    );
  }

  if (finalResponse) {
    const validation = await input.contentFilter.validateResponse(
      finalResponse,
      {
        question: input.question,
        retrievedSources: rawSources.map((source) => ({
          content: source.content,
          metadata: source.metadata ?? {},
        })),
        courseId: input.sessionContext.courseId,
        lectureId: input.lectureId,
      },
      { strictMode, courseId: input.sessionContext.courseId },
    );

    if (!validation.isValid) {
      outcome.filterTriggered = true;

      const suggestions = formatSuggestionMessage(
        input.question,
        buildSuggestionFallback(
          input.question,
          input.sessionContext.lectureCatalog,
          { excludeLectureId: input.lectureId },
        ).suggestions,
      );

      finalResponse =
        validation.suggestedResponse ??
        (await input.contentFilter.transformToGuidance(finalResponse, {
          courseId: input.sessionContext.courseId,
          lectureId: input.lectureId,
          topic: input.sessionContext.lecture?.title,
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
      input.conversationRepository,
      input.threadId,
      input.question,
      finalResponse,
      sources,
    );
  }

  return {
    threadId: input.threadId,
    conversationId: input.conversationId,
    sources,
    usedFallback: outcome.usedFallback,
    outcome,
  };
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
    }

    if (error instanceof ContentFilterError) {
      throw new AskTutorError(500, error.message, AskTutorErrorCodes.UNKNOWN);
    }

    if (error instanceof Error) {
      throw new AskTutorError(
        502,
        error.message,
        AskTutorErrorCodes.LLM_ERROR,
      );
    }

    throw error;
  }
}

export async function* askTutorUseCase(
  input: AskTutorInputDTO & { userId: string },
  deps: AskTutorUseCaseDeps,
): AsyncGenerator<string, AskTutorResultDTO & { outcome: AskTutorRequestOutcome }> {
  const { conversationRepository, contentFilter } = deps;

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
    const thread = await conversationRepository.getOrCreateThread(
      conversation.id,
      topic,
      input.lectureId,
    );

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
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AI_TUTOR_PROFILE] Failed to update learning profile', error);
      }
    });

    const sessionMetaIntent = detectSessionMetaIntent(input.question);

    // RAG retrieval, guards, integrity checks, prompting, memory, and LLM
    // execution all run inside the ai-platform tutor graph via streamAgent.
    return yield* streamTutorViaPlatformRuntime({
      userId: input.userId,
      question: input.question,
      sessionContext,
      sessionMetaIntent,
      lectureId: input.lectureId,
      threadId: thread.id,
      conversationId: conversation.id,
      history,
      conversationRepository,
      contentFilter,
      outcome,
    });
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
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
      error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة سؤالك',
      AskTutorErrorCodes.UNKNOWN,
    );
  }
}

import type { AskTutorInputDTO, AskTutorResultDTO } from '../dto/ask-tutor.dto';
import {
  buildTutorSessionContext,
  type CourseContextServiceDeps,
} from '../services/course-context.service';
import { getTutorBasePromptVersion } from '../services/prompt-builder';
import { detectSessionMetaIntent } from '../services/student-info.service';
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
import type { TutorSseEvent } from '../../shared/sse-protocol';
import { streamAgent, type RetrievedSource } from '@/ai-platform';
import type { TutorPersonalizationContext } from '@/ai-platform/graph/state/tutor-agent.state';
import { PlatformError } from '@/ai-platform/shared/errors';
import { mapPlatformErrorToAskTutorError } from '../../infrastructure/guards/platform-error.mapper';
import type { TutorSessionContext } from '../../domain/models/TutorSessionContext';
import { TutorResponseProcessorAdapter } from '../../infrastructure/adapters/TutorResponseProcessorAdapter';
import { tutorResponseEnricherAdapter } from '../../infrastructure/adapters/TutorResponseEnricherAdapter';

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

function buildPersonalizationContext(
  sessionContext: TutorSessionContext,
  sessionMetaIntent: ReturnType<typeof detectSessionMetaIntent>,
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

function mapRunMetadataToOutcome(
  metadata: Record<string, unknown> | undefined,
  outcome: AskTutorRequestOutcome,
): void {
  if (!metadata) {
    return;
  }

  if (metadata.assessmentBlocked === true) {
    outcome.assessmentBlocked = true;
    outcome.usedFallback = true;
  }

  if (metadata.filterTriggered === true) {
    outcome.filterTriggered = true;
  }
}

async function* streamTutorViaPlatformRuntime(input: {
  userId: string;
  question: string;
  sessionContext: TutorSessionContext;
  lectureId?: string;
  threadId: string;
  conversationId: string;
  history: MessageDTO[];
  conversationRepository: ConversationRepositoryPort;
  contentFilter: ContentFilterPort;
  outcome: AskTutorRequestOutcome;
  signal?: AbortSignal;
}): AsyncGenerator<TutorSseEvent, AskTutorResultDTO & { outcome: AskTutorRequestOutcome }> {
  const { outcome } = input;
  const sessionMetaIntent = detectSessionMetaIntent(input.question);
  const personalization = buildPersonalizationContext(
    input.sessionContext,
    sessionMetaIntent,
  );
  const responseProcessor = new TutorResponseProcessorAdapter(input.contentFilter);

  let sources: MessageSourceDTO[] = [];
  let validatedOutput: string | undefined;

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
        signal: input.signal,
        metadata: {
          conversationHistory: input.history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          personalization,
          promptVersion: getTutorBasePromptVersion(),
          responseProcessor,
          responseEnricher: tutorResponseEnricherAdapter,
          enrichmentContext: {
            lectureCatalog: input.sessionContext.lectureCatalog,
            lectureId: input.lectureId,
          },
        },
      },
    })) {
      if (event.type === 'meta' && event.sources) {
        sources = mapPlatformSourcesToMessageSources(event.sources);
        outcome.retrievalChunkCount = event.sources.length;
        outcome.usedFallback = event.usedFallback ?? false;

        yield {
          type: 'meta',
          sources,
          usedFallback: outcome.usedFallback,
          educationalFilterApplied: outcome.filterTriggered,
        };
      }

      if (event.type === 'token') {
        yield { type: 'token', text: event.text };
      }

      if (event.type === 'replace') {
        yield { type: 'replace', text: event.text };
      }

      if (event.type === 'done') {
        if (event.output) {
          validatedOutput = event.output.trim();
        }
        mapRunMetadataToOutcome(event.metadata, outcome);

        if (outcome.assessmentBlocked || outcome.filterTriggered) {
          yield {
            type: 'meta',
            sources,
            usedFallback: outcome.usedFallback || outcome.assessmentBlocked,
            educationalFilterApplied:
              outcome.filterTriggered || outcome.assessmentBlocked,
          };
        }
      }

      if (event.type === 'error') {
        throw mapPlatformErrorToAskTutorError(event);
      }
    }

    const finalResponse = validatedOutput?.trim() ?? '';

    if (finalResponse) {
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
  input: AskTutorInputDTO & { userId: string; signal?: AbortSignal },
  deps: AskTutorUseCaseDeps,
): AsyncGenerator<TutorSseEvent, AskTutorResultDTO & { outcome: AskTutorRequestOutcome }> {
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

    return yield* streamTutorViaPlatformRuntime({
      userId: input.userId,
      question: input.question,
      sessionContext,
      lectureId: input.lectureId,
      threadId: thread.id,
      conversationId: conversation.id,
      history,
      conversationRepository,
      contentFilter,
      outcome,
      signal: input.signal,
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

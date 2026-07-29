import type { GetTutorThreadInputDTO, TutorThreadMessagesDTO } from '../dto/tutor-thread.dto';
import {
  buildTutorSessionContext,
  type CourseContextServiceDeps,
} from '../services/course-context.service';
import { AskTutorError, AskTutorErrorCodes } from '../errors/ask-tutor.errors';
import type { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import { AI_TUTOR_CONSTANTS } from '../../shared';

export type GetTutorThreadMessagesUseCaseDeps = CourseContextServiceDeps & {
  conversationRepository: ConversationRepositoryPort;
};

export async function getTutorThreadMessagesUseCase(
  input: GetTutorThreadInputDTO & { userId: string },
  deps: GetTutorThreadMessagesUseCaseDeps,
): Promise<TutorThreadMessagesDTO> {
  const { conversationRepository } = deps;

  try {
    const sessionContext = await buildTutorSessionContext(
      {
        courseSlug: input.courseSlug,
        userId: input.userId,
        lectureId: input.lectureId,
      },
      deps,
    );

    const conversation = await conversationRepository.getOrCreateConversation(
      sessionContext.courseId,
      input.userId,
    );

    const topic =
      sessionContext.lecture?.title ??
      input.lectureTitle?.trim() ??
      'محادثة عامة';
    const thread = await conversationRepository.getOrCreateThread(
      conversation.id,
      topic,
      input.lectureId,
    );

    const messages = await conversationRepository.getThreadMessages(
      thread.id,
      AI_TUTOR_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
    );

    return {
      threadId: thread.id,
      conversationId: conversation.id,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        sources: message.retrievedSources,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    throw new AskTutorError(
      500,
      'فشل تحميل سجل المحادثة',
      AskTutorErrorCodes.UNKNOWN,
    );
  }
}

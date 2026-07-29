import type {
  TutorMessage as PrismaTutorMessage,
  TutorThread as PrismaTutorThread,
  TutorConversation as PrismaTutorConversation,
} from '@/generated/prisma/client';
import { TutorMessageRole } from '@/generated/prisma/enums';

import type {
  ConversationDTO,
  MessageDTO,
  ThreadDTO,
} from '../../domain/ports/ConversationRepositoryPort';
import type { MessageSourceDTO } from '../../application/dto/message-source.dto';

type ConversationWithThreads = PrismaTutorConversation & {
  threads: Array<PrismaTutorThread & { messages: PrismaTutorMessage[] }>;
};

type ThreadWithMessages = PrismaTutorThread & {
  messages: PrismaTutorMessage[];
};

function parseRetrievedSources(value: unknown): MessageSourceDTO[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  if (typeof value[0] === 'string') {
    return value.map((id) => ({
      id: String(id),
      title: 'مصدر من الدورة',
      relevanceScore: 0,
    }));
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const source = item as Record<string, unknown>;
      return {
        id: String(source.id ?? ''),
        title: String(source.title ?? 'مصدر من الدورة'),
        source:
          typeof source.source === 'string' ? source.source : undefined,
        relevanceScore: Number(source.relevanceScore ?? 0),
        contentType:
          typeof source.contentType === 'string'
            ? source.contentType
            : undefined,
        lectureId:
          typeof source.lectureId === 'string' ? source.lectureId : undefined,
      };
    })
    .filter((source) => source.id.length > 0);
}

export function mapMessage(message: PrismaTutorMessage): MessageDTO {
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role === TutorMessageRole.USER ? 'user' : 'assistant',
    content: message.content,
    retrievedSources: parseRetrievedSources(message.retrievedSources),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function mapThread(thread: ThreadWithMessages): ThreadDTO {
  return {
    id: thread.id,
    conversationId: thread.conversationId,
    lectureId: thread.lectureId ?? undefined,
    topic: thread.topic,
    messages: thread.messages.map(mapMessage),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

export function mapConversation(conversation: ConversationWithThreads): ConversationDTO {
  return {
    id: conversation.id,
    courseId: conversation.courseId,
    userId: conversation.userId,
    threads: conversation.threads.map(mapThread),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function mapMessageRole(role: MessageDTO['role']): TutorMessageRole {
  return role === 'user' ? TutorMessageRole.USER : TutorMessageRole.ASSISTANT;
}

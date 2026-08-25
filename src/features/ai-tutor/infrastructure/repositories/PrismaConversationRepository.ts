import { randomUUID } from 'node:crypto';

import { prisma } from '@/lib/prisma';
import {
  TutorMessageStatus,
  TutorTurnIdempotencyStatus,
} from '@/generated/prisma/enums';

import {
  ConversationRepositoryError,
  ConversationRepositoryErrorCodes,
  type ConversationDTO,
  type ConversationRepositoryPort,
  type IdempotencyRecord,
  type MessageDTO,
  type ThreadDTO,
  type TurnHandle,
} from '../../domain/ports/ConversationRepositoryPort';
import {
  mapConversation,
  mapMessage,
  mapMessageRole,
  mapThread,
} from './conversation.mapper';

const threadInclude = {
  messages: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export class PrismaConversationRepository implements ConversationRepositoryPort {
  async findConversation(
    courseId: string,
    userId: string,
  ): Promise<ConversationDTO | null> {
    const conversation = await prisma.tutorConversation.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      include: {
        threads: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return conversation ? mapConversation(conversation) : null;
  }

  async findThread(
    conversationId: string,
    params: { lectureId?: string; topic?: string },
  ): Promise<ThreadDTO | null> {
    const thread = params.lectureId
      ? await prisma.tutorThread.findUnique({
          where: {
            conversationId_lectureId: {
              conversationId,
              lectureId: params.lectureId,
            },
          },
          include: threadInclude,
        })
      : await prisma.tutorThread.findFirst({
          where: {
            conversationId,
            lectureId: null,
            ...(params.topic ? { topic: params.topic } : {}),
          },
          include: threadInclude,
        });

    return thread ? mapThread(thread) : null;
  }

  async persistTurn(
    threadId: string,
    params: {
      userContent: string;
      assistantContent: string;
      retrievedSources?: MessageDTO['retrievedSources'];
    },
  ): Promise<{ userMessage: MessageDTO; assistantMessage: MessageDTO }> {
    const thread = await prisma.tutorThread.findUnique({
      where: { id: threadId },
      select: { id: true, conversationId: true },
    });

    if (!thread) {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'الموضوع غير موجود',
      );
    }

    const [userMessage, assistantMessage] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.tutorMessage.create({
          data: {
            threadId,
            role: mapMessageRole('user'),
            content: params.userContent,
          },
        });

        const assistant = await tx.tutorMessage.create({
          data: {
            threadId,
            role: mapMessageRole('assistant'),
            content: params.assistantContent,
            retrievedSources: params.retrievedSources,
          },
        });

        const now = new Date();
        await tx.tutorThread.update({
          where: { id: threadId },
          data: { updatedAt: now },
        });
        await tx.tutorConversation.update({
          where: { id: thread.conversationId },
          data: { updatedAt: now },
        });

        return [user, assistant];
      },
    );

    return {
      userMessage: mapMessage(userMessage),
      assistantMessage: mapMessage(assistantMessage),
    };
  }

  async getOrCreateConversation(
    courseId: string,
    userId: string,
  ): Promise<ConversationDTO> {
    const conversation = await prisma.tutorConversation.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      create: {
        courseId,
        userId,
      },
      update: {},
      include: {
        threads: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return mapConversation(conversation);
  }

  async getConversation(
    conversationId: string,
  ): Promise<ConversationDTO | null> {
    const conversation = await prisma.tutorConversation.findUnique({
      where: { id: conversationId },
      include: {
        threads: {
          include: threadInclude,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return conversation ? mapConversation(conversation) : null;
  }

  async getUserConversations(userId: string): Promise<ConversationDTO[]> {
    const conversations = await prisma.tutorConversation.findMany({
      where: { userId },
      include: {
        threads: {
          include: threadInclude,
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map(mapConversation);
  }

  async getOrCreateThread(
    conversationId: string,
    topic: string,
    lectureId?: string,
  ): Promise<ThreadDTO> {
    const existing = lectureId
      ? await prisma.tutorThread.findUnique({
          where: {
            conversationId_lectureId: {
              conversationId,
              lectureId,
            },
          },
          include: threadInclude,
        })
      : await prisma.tutorThread.findFirst({
          where: {
            conversationId,
            lectureId: null,
          },
          include: threadInclude,
        });

    if (existing) {
      return mapThread(existing);
    }

    const created = await prisma.tutorThread.create({
      data: {
        conversationId,
        lectureId,
        topic,
      },
      include: threadInclude,
    });

    await prisma.tutorConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return mapThread(created);
  }

  async getThreadMessages(threadId: string, limit = 20): Promise<MessageDTO[]> {
    const messages = await prisma.tutorMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map(mapMessage);
  }

  async getThreadMessagesPaginated(
    threadId: string,
    params: { before?: string; limit?: number },
  ): Promise<{ messages: MessageDTO[]; nextCursor: string | null }> {
    const limit = params.limit ?? 20;
    const cursorMessage = params.before
      ? await prisma.tutorMessage.findUnique({
          where: { id: params.before },
          select: { createdAt: true, id: true },
        })
      : null;

    const messages = await prisma.tutorMessage.findMany({
      where: {
        threadId,
        ...(cursorMessage
          ? {
              OR: [
                { createdAt: { lt: cursorMessage.createdAt } },
                {
                  createdAt: cursorMessage.createdAt,
                  id: { lt: cursorMessage.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    const ordered = [...page].reverse().map(mapMessage);

    return {
      messages: ordered,
      nextCursor,
    };
  }

  async beginTurn(
    threadId: string,
    params: { userContent: string; turnId?: string },
  ): Promise<TurnHandle> {
    const thread = await prisma.tutorThread.findUnique({
      where: { id: threadId },
      select: { id: true, conversationId: true },
    });

    if (!thread) {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'الموضوع غير موجود',
      );
    }

    const turnId = params.turnId ?? randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const userMessage = await tx.tutorMessage.create({
        data: {
          threadId,
          role: mapMessageRole('user'),
          content: params.userContent,
          status: TutorMessageStatus.COMPLETED,
          turnId,
        },
      });

      const assistantMessage = await tx.tutorMessage.create({
        data: {
          threadId,
          role: mapMessageRole('assistant'),
          content: '',
          status: TutorMessageStatus.PENDING,
          turnId,
        },
      });

      const now = new Date();
      await tx.tutorThread.update({
        where: { id: threadId },
        data: { updatedAt: now },
      });
      await tx.tutorConversation.update({
        where: { id: thread.conversationId },
        data: { updatedAt: now },
      });

      return { userMessage, assistantMessage };
    });

    return {
      turnId,
      userMessageId: result.userMessage.id,
      assistantMessageId: result.assistantMessage.id,
    };
  }

  async completeTurn(
    turnId: string,
    params: {
      assistantContent: string;
      retrievedSources?: MessageDTO['retrievedSources'];
    },
  ): Promise<void> {
    const updated = await prisma.tutorMessage.updateMany({
      where: {
        turnId,
        role: mapMessageRole('assistant'),
      },
      data: {
        content: params.assistantContent,
        retrievedSources: params.retrievedSources,
        status: TutorMessageStatus.COMPLETED,
      },
    });

    if (updated.count === 0) {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'الرسالة غير موجودة',
      );
    }
  }

  async failTurn(
    turnId: string,
    status: 'failed' | 'cancelled' = 'failed',
  ): Promise<void> {
    const prismaStatus =
      status === 'cancelled'
        ? TutorMessageStatus.CANCELLED
        : TutorMessageStatus.FAILED;

    await prisma.tutorMessage.updateMany({
      where: {
        turnId,
        role: mapMessageRole('assistant'),
        status: TutorMessageStatus.PENDING,
      },
      data: {
        status: prismaStatus,
      },
    });
  }

  async claimIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
    threadId: string;
  }): Promise<
    | { kind: 'created'; recordId: string }
    | { kind: 'replay'; record: IdempotencyRecord }
    | { kind: 'conflict' }
  > {
    const existing = await prisma.tutorTurnIdempotency.findUnique({
      where: {
        userId_idempotencyKey: {
          userId: params.userId,
          idempotencyKey: params.idempotencyKey,
        },
      },
    });

    if (existing) {
      if (
        existing.status === TutorTurnIdempotencyStatus.COMPLETED &&
        existing.turnId
      ) {
        return {
          kind: 'replay',
          record: {
            id: existing.id,
            userId: existing.userId,
            idempotencyKey: existing.idempotencyKey,
            threadId: existing.threadId,
            turnId: existing.turnId,
            status: 'completed',
          },
        };
      }

      if (existing.status === TutorTurnIdempotencyStatus.PROCESSING) {
        return { kind: 'conflict' };
      }
    }

    try {
      const created = await prisma.tutorTurnIdempotency.create({
        data: {
          userId: params.userId,
          idempotencyKey: params.idempotencyKey,
          threadId: params.threadId,
          status: TutorTurnIdempotencyStatus.PROCESSING,
        },
      });

      return { kind: 'created', recordId: created.id };
    } catch {
      const raced = await prisma.tutorTurnIdempotency.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: params.userId,
            idempotencyKey: params.idempotencyKey,
          },
        },
      });

      if (
        raced?.status === TutorTurnIdempotencyStatus.COMPLETED &&
        raced.turnId
      ) {
        return {
          kind: 'replay',
          record: {
            id: raced.id,
            userId: raced.userId,
            idempotencyKey: raced.idempotencyKey,
            threadId: raced.threadId,
            turnId: raced.turnId,
            status: 'completed',
          },
        };
      }

      return { kind: 'conflict' };
    }
  }

  async completeIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
    turnId: string;
  }): Promise<void> {
    await prisma.tutorTurnIdempotency.update({
      where: {
        userId_idempotencyKey: {
          userId: params.userId,
          idempotencyKey: params.idempotencyKey,
        },
      },
      data: {
        turnId: params.turnId,
        status: TutorTurnIdempotencyStatus.COMPLETED,
      },
    });
  }

  async failIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
  }): Promise<void> {
    await prisma.tutorTurnIdempotency.updateMany({
      where: {
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
        status: TutorTurnIdempotencyStatus.PROCESSING,
      },
      data: {
        status: TutorTurnIdempotencyStatus.FAILED,
      },
    });
  }

  async addMessage(
    threadId: string,
    message: Omit<MessageDTO, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MessageDTO> {
    const thread = await prisma.tutorThread.findUnique({
      where: { id: threadId },
      select: { id: true, conversationId: true },
    });

    if (!thread) {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'الموضوع غير موجود',
      );
    }

    const savedMessage = await prisma.$transaction(async (tx) => {
      const created = await tx.tutorMessage.create({
        data: {
          threadId,
          role: mapMessageRole(message.role),
          content: message.content,
          retrievedSources: message.retrievedSources,
        },
      });

      const now = new Date();
      await tx.tutorThread.update({
        where: { id: threadId },
        data: { updatedAt: now },
      });
      await tx.tutorConversation.update({
        where: { id: thread.conversationId },
        data: { updatedAt: now },
      });

      return created;
    });

    return mapMessage(savedMessage);
  }

  async getMessage(messageId: string): Promise<MessageDTO | null> {
    const message = await prisma.tutorMessage.findUnique({
      where: { id: messageId },
    });

    return message ? mapMessage(message) : null;
  }

  async updateMessage(messageId: string, content: string): Promise<MessageDTO> {
    try {
      const updated = await prisma.tutorMessage.update({
        where: { id: messageId },
        data: { content },
      });

      return mapMessage(updated);
    } catch {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'الرسالة غير موجودة',
      );
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await prisma.tutorMessage.deleteMany({
      where: { id: messageId },
    });

    return result.count > 0;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const result = await prisma.tutorConversation.deleteMany({
      where: { id: conversationId },
    });

    return result.count > 0;
  }

  async searchMessages(
    conversationId: string,
    query: string,
  ): Promise<MessageDTO[]> {
    const messages = await prisma.tutorMessage.findMany({
      where: {
        thread: { conversationId },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return messages.map(mapMessage);
  }

  async getConversationStats(conversationId: string): Promise<{
    threadCount: number;
    messageCount: number;
    lastMessageAt: Date | null;
  }> {
    const conversation = await prisma.tutorConversation.findUnique({
      where: { id: conversationId },
      select: {
        threads: {
          select: {
            _count: {
              select: { messages: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new ConversationRepositoryError(
        ConversationRepositoryErrorCodes.NOT_FOUND,
        'المحادثة غير موجودة',
      );
    }

    const messageCount = conversation.threads.reduce(
      (total, thread) => total + thread._count.messages,
      0,
    );

    const lastMessageAt = conversation.threads.reduce<Date | null>(
      (latest, thread) => {
        const createdAt = thread.messages[0]?.createdAt ?? null;
        if (!createdAt) {
          return latest;
        }
        if (!latest || createdAt > latest) {
          return createdAt;
        }
        return latest;
      },
      null,
    );

    return {
      threadCount: conversation.threads.length,
      messageCount,
      lastMessageAt,
    };
  }
}

export const prismaConversationRepository = new PrismaConversationRepository();

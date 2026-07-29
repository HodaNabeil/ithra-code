import { prisma } from '@/lib/prisma';

import {
  ConversationRepositoryError,
  ConversationRepositoryErrorCodes,
  type ConversationDTO,
  type ConversationRepositoryPort,
  type MessageDTO,
  type ThreadDTO,
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
          include: threadInclude,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return mapConversation(conversation);
  }

  async getConversation(conversationId: string): Promise<ConversationDTO | null> {
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
            topic,
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
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(mapMessage);
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

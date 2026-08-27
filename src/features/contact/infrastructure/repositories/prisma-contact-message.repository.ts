import { prisma } from '@/lib/prisma';
import type { ContactMessageRepository } from '../../domain/repositories/contact-message.repository.interface';
import type {
  ContactMessage,
  CreateContactMessageInput,
} from '../../domain/entities/contact-message.entity';

export class PrismaContactMessageRepository implements ContactMessageRepository {
  async create(input: CreateContactMessageInput): Promise<ContactMessage> {
    return prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        message: input.message,
      },
    });
  }
}

export const prismaContactMessageRepository =
  new PrismaContactMessageRepository();

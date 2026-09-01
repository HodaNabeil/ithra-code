import type {
  ContactMessage,
  CreateContactMessageInput,
} from '../entities/contact-message.entity';

export interface ContactMessageRepository {
  create(input: CreateContactMessageInput): Promise<ContactMessage>;
}

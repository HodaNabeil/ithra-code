import type { ContactMessage } from '../../domain/entities/contact-message.entity';

export interface ContactNotifier {
  notify(message: ContactMessage): Promise<void>;
}

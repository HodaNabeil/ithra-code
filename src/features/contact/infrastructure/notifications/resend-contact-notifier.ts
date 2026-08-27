import { Resend } from 'resend';

import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import type { ContactNotifier } from '../../application/ports/contact-notifier.port';
import type { ContactMessage } from '../../domain/entities/contact-message.entity';

export class ResendContactNotifier implements ContactNotifier {
  private readonly client: Resend | null;

  constructor() {
    this.client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  async notify(message: ContactMessage): Promise<void> {
    if (
      !this.client ||
      !env.PAYMENT_EMAIL_FROM ||
      !env.CONTACT_NOTIFICATION_EMAIL
    ) {
      logger.info(
        { contactMessageId: message.id },
        '[CONTACT_EMAIL_SKIPPED] Resend or contact notification email not configured',
      );
      return;
    }

    await this.client.emails.send({
      from: env.PAYMENT_EMAIL_FROM,
      to: env.CONTACT_NOTIFICATION_EMAIL,
      subject: 'New Contact Message — IthraCode',
      text: [
        'New contact message received on IthraCode.',
        '',
        `Name: ${message.name}`,
        `Email: ${message.email}`,
        '',
        'Message:',
        message.message,
      ].join('\n'),
    });

    logger.info(
      { contactMessageId: message.id },
      '[CONTACT_EMAIL_SENT]',
    );
  }
}

export const resendContactNotifier = new ResendContactNotifier();

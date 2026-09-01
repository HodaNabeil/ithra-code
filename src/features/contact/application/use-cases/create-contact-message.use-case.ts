import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import type { ContactRateLimiter } from '../ports/contact-rate-limiter.port';
import type { ContactNotifier } from '../ports/contact-notifier.port';
import type { TurnstileVerifier } from '../ports/turnstile-verifier.port';
import type { ContactMessageRepository } from '../../domain/repositories/contact-message.repository.interface';
import {
  ContactError,
  CONTACT_ERROR_CODES,
} from '../../domain/errors/contact.errors';
import {
  CONTACT_HONEYPOT_SUCCESS_MESSAGE,
  CONTACT_SUCCESS_MESSAGE,
  createContactMessageSchema,
} from '../../api/validation/contact.validation';

export type CreateContactMessageResult = {
  success: true;
  message: string;
  honeypot?: boolean;
  contactMessageId?: string;
};

export type CreateContactMessageContext = {
  ip: string | null;
};

export type CreateContactMessageDependencies = {
  repository: ContactMessageRepository;
  rateLimiter: ContactRateLimiter;
  turnstileVerifier: TurnstileVerifier;
  notifier: ContactNotifier;
};

export async function createContactMessageUseCase(
  input: unknown,
  ctx: CreateContactMessageContext,
  deps: CreateContactMessageDependencies,
): Promise<CreateContactMessageResult> {
  await deps.rateLimiter.check(ctx.ip);

  let data;
  try {
    data = createContactMessageSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const message =
        error.issues.map((issue) => issue.message).join(', ') ||
        'يرجى التحقق من البيانات المدخلة';
      throw new ContactError(400, message, CONTACT_ERROR_CODES.VALIDATION_ERROR);
    }
    throw error;
  }

  if (data.website?.trim()) {
    return {
      success: true,
      message: CONTACT_HONEYPOT_SUCCESS_MESSAGE,
      honeypot: true,
    };
  }

  await deps.turnstileVerifier.verify(data.turnstileToken, ctx.ip);

  const saved = await deps.repository.create({
    name: data.name,
    email: data.email,
    message: data.message,
  });

  try {
    await deps.notifier.notify(saved);
  } catch (error) {
    logger.error(
      { contactMessageId: saved.id, error },
      '[CONTACT_EMAIL_FAILED]',
    );
  }

  return {
    success: true,
    message: CONTACT_SUCCESS_MESSAGE,
    contactMessageId: saved.id,
  };
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContactMessageUseCase } from '@/features/contact/application/use-cases/create-contact-message.use-case';
import {
  ContactError,
  CONTACT_ERROR_CODES,
} from '@/features/contact/domain/errors/contact.errors';
import type { ContactMessageRepository } from '@/features/contact/domain/repositories/contact-message.repository.interface';
import type { ContactRateLimiter } from '@/features/contact/application/ports/contact-rate-limiter.port';
import type { ContactNotifier } from '@/features/contact/application/ports/contact-notifier.port';
import type { TurnstileVerifier } from '@/features/contact/application/ports/turnstile-verifier.port';
import type { ContactMessage } from '@/features/contact/domain/entities/contact-message.entity';

const savedMessage: ContactMessage = {
  id: 'cm_123',
  name: 'Hoda',
  email: 'hoda@example.com',
  message: 'I would like to ask about the course.',
  status: 'NEW',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const validInput = {
  name: 'Hoda',
  email: 'hoda@example.com',
  message: 'I would like to ask about the course.',
  website: '',
};

const mockRepository: ContactMessageRepository = {
  create: vi.fn(),
};

const mockRateLimiter: ContactRateLimiter = {
  check: vi.fn(),
};

const mockTurnstileVerifier: TurnstileVerifier = {
  verify: vi.fn(),
};

const mockNotifier: ContactNotifier = {
  notify: vi.fn(),
};

const deps = {
  repository: mockRepository,
  rateLimiter: mockRateLimiter,
  turnstileVerifier: mockTurnstileVerifier,
  notifier: mockNotifier,
};

describe('createContactMessageUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.create).mockResolvedValue(savedMessage);
    vi.mocked(mockRateLimiter.check).mockResolvedValue(undefined);
    vi.mocked(mockTurnstileVerifier.verify).mockResolvedValue(undefined);
    vi.mocked(mockNotifier.notify).mockResolvedValue(undefined);
  });

  it('stores the message and notifies admin on valid input', async () => {
    const result = await createContactMessageUseCase(
      validInput,
      { ip: '127.0.0.1' },
      deps,
    );

    expect(mockRateLimiter.check).toHaveBeenCalledWith('127.0.0.1');
    expect(mockRepository.create).toHaveBeenCalledWith({
      name: validInput.name,
      email: validInput.email,
      message: validInput.message,
    });
    expect(mockNotifier.notify).toHaveBeenCalledWith(savedMessage);
    expect(result).toMatchObject({
      success: true,
      contactMessageId: savedMessage.id,
    });
  });

  it('returns success without persisting when honeypot is filled', async () => {
    const result = await createContactMessageUseCase(
      { ...validInput, website: 'spam-link.com' },
      { ip: '127.0.0.1' },
      deps,
    );

    expect(result.success).toBe(true);
    expect(result.honeypot).toBe(true);
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockNotifier.notify).not.toHaveBeenCalled();
  });

  it('throws validation error for invalid email', async () => {
    await expect(
      createContactMessageUseCase(
        { ...validInput, email: 'not-an-email' },
        { ip: '127.0.0.1' },
        deps,
      ),
    ).rejects.toMatchObject({
      code: CONTACT_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it('still succeeds when email notification fails', async () => {
    vi.mocked(mockNotifier.notify).mockRejectedValue(
      new Error('email provider down'),
    );

    const result = await createContactMessageUseCase(
      validInput,
      { ip: '127.0.0.1' },
      deps,
    );

    expect(result.success).toBe(true);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('propagates rate limit errors', async () => {
    vi.mocked(mockRateLimiter.check).mockRejectedValue(
      new ContactError(
        429,
        'Too many requests',
        CONTACT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ),
    );

    await expect(
      createContactMessageUseCase(validInput, { ip: '127.0.0.1' }, deps),
    ).rejects.toBeInstanceOf(ContactError);
  });
});

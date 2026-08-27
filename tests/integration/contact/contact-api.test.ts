import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/contact/route';
import { CONTACT_ERROR_CODES } from '@/features/contact/domain/errors/contact.errors';

const submitContactMessage = vi.fn();

vi.mock('@/features/contact/infrastructure/di/contact.container', () => ({
  submitContactMessage: (...args: unknown[]) => submitContactMessage(...args),
}));

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 on successful submission', async () => {
    submitContactMessage.mockResolvedValue({
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.',
      contactMessageId: 'cm_123',
    });

    const response = await POST(
      new Request('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({
          name: 'Hoda',
          email: 'hoda@example.com',
          message: 'I would like to ask about the course.',
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.',
    });
    expect(submitContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'hoda@example.com' }),
      { ip: '203.0.113.10' },
    );
  });

  it('returns structured 429 response when rate limit is exceeded', async () => {
    const { ContactError } = await import(
      '@/features/contact/domain/errors/contact.errors'
    );

    submitContactMessage.mockRejectedValue(
      new ContactError(
        429,
        'تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.',
        CONTACT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ),
    );

    const response = await POST(
      new Request('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hoda',
          email: 'hoda@example.com',
          message: 'I would like to ask about the course.',
        }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: CONTACT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.',
      },
    });
  });

  it('returns generic success for honeypot submissions', async () => {
    submitContactMessage.mockResolvedValue({
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.',
      honeypot: true,
    });

    const response = await POST(
      new Request('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bot',
          email: 'bot@example.com',
          message: 'Buy cheap products now',
          website: 'spam-link.com',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.',
    });
  });
});

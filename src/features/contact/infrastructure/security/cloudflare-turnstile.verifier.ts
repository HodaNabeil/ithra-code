import { logger } from '@/lib/logger';
import { resolveTurnstileSecretKey } from '../../lib/turnstile-config';
import type { TurnstileVerifier } from '../../application/ports/turnstile-verifier.port';
import {
  ContactError,
  CONTACT_ERROR_CODES,
} from '../../domain/errors/contact.errors';

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export class CloudflareTurnstileVerifier implements TurnstileVerifier {
  async verify(token: string | undefined, ip: string | null): Promise<void> {
    const secretKey = resolveTurnstileSecretKey();
    if (!secretKey) {
      logger.info('[TURNSTILE_SKIPPED] Turnstile secret key not configured');
      return;
    }

    if (!token?.trim()) {
      throw new ContactError(
        403,
        'تعذر التحقق من الطلب',
        CONTACT_ERROR_CODES.SECURITY_VERIFICATION_FAILED,
      );
    }

    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    if (ip) {
      body.set('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      throw new ContactError(
        403,
        'تعذر التحقق من الطلب',
        CONTACT_ERROR_CODES.SECURITY_VERIFICATION_FAILED,
      );
    }

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      logger.warn(
        { errorCodes: result['error-codes'] },
        '[TURNSTILE_VERIFICATION_FAILED]',
      );
      throw new ContactError(
        403,
        'تعذر التحقق من الطلب',
        CONTACT_ERROR_CODES.SECURITY_VERIFICATION_FAILED,
      );
    }
  }
}

export const cloudflareTurnstileVerifier = new CloudflareTurnstileVerifier();

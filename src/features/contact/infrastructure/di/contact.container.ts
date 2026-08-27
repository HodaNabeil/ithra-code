import { createContactMessageUseCase } from '../../application/use-cases/create-contact-message.use-case';
import { prismaContactMessageRepository } from '../repositories/prisma-contact-message.repository';
import { redisContactRateLimiter } from '../rate-limit/redis-contact-rate-limiter';
import { cloudflareTurnstileVerifier } from '../security/cloudflare-turnstile.verifier';
import { resendContactNotifier } from '../notifications/resend-contact-notifier';

const contactDependencies = {
  repository: prismaContactMessageRepository,
  rateLimiter: redisContactRateLimiter,
  turnstileVerifier: cloudflareTurnstileVerifier,
  notifier: resendContactNotifier,
} as const;

export async function submitContactMessage(
  input: unknown,
  ctx: { ip: string | null },
) {
  return createContactMessageUseCase(input, ctx, contactDependencies);
}

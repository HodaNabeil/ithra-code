import { WebhookError } from '../errors/webhook.errors';

export type WebhookReplayGuardInput = {
  eventCreatedAt: Date | null;
  now?: Date;
};

const MAX_FUTURE_SKEW_MS = 60_000;

/**
 * Rejects webhook events outside an acceptable timestamp window.
 * Defense-in-depth alongside HMAC and providerEventId idempotency.
 */
export class WebhookReplayGuard {
  constructor(private readonly windowSeconds: number) {}

  assertFresh(input: WebhookReplayGuardInput): void {
    if (!input.eventCreatedAt || Number.isNaN(input.eventCreatedAt.getTime())) {
      throw new WebhookError(
        401,
        'طابع زمني إشعار الدفع مفقود أو غير صالح',
        'REPLAY_DETECTED',
      );
    }

    const now = input.now ?? new Date();
    const ageMs = now.getTime() - input.eventCreatedAt.getTime();

    if (ageMs > this.windowSeconds * 1000) {
      throw new WebhookError(
        401,
        'إشعار الدفع منتهي الصلاحية',
        'REPLAY_DETECTED',
      );
    }

    if (ageMs < -MAX_FUTURE_SKEW_MS) {
      throw new WebhookError(
        401,
        'طابع زمني إشعار الدفع غير صالح',
        'REPLAY_DETECTED',
      );
    }
  }
}

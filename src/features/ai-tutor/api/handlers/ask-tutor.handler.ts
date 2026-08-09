import { auth } from '@/lib/auth';

import { askTutorInputSchema } from '../../application/dto/ask-tutor.dto';
import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  logTutorRequestCompleted,
  logTutorRequestFailed,
} from '../../infrastructure/observability/tutor-request-logger';
import {
  askTutorUseCase,
  getAskTutorUseCaseDeps,
} from '../../infrastructure/di/ai-tutor-container';
import { encodeSseCommentLine, encodeSseDataLine } from '../../shared/sse-protocol';

const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
} as const;

const HEARTBEAT_INTERVAL_MS = 15_000;

export async function handleAskTutorRequest(request: Request): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return Response.json(
      { success: false, message: 'ميزة المدرس الذكي غير مفعّلة' },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: 'يجب تسجيل الدخول لاستخدام المدرس الذكي' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: 'صيغة الطلب غير صالحة' },
      { status: 400 },
    );
  }

  const parsed = askTutorInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'بيانات الطلب غير صالحة';
    return Response.json({ success: false, message }, { status: 400 });
  }

  const idempotencyKey =
    request.headers.get('idempotency-key')?.trim() ||
    request.headers.get('Idempotency-Key')?.trim() ||
    undefined;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const startedAt = Date.now();
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  void (async () => {
    heartbeatTimer = setInterval(() => {
      void writer.write(encodeSseCommentLine('ping')).catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);

    try {
      const generator = askTutorUseCase(
        {
          ...parsed.data,
          userId: session.user.id,
          signal: request.signal,
          idempotencyKey,
        },
        getAskTutorUseCaseDeps(),
      );

      let result;
      while (true) {
        const { value, done } = await generator.next();
        if (done) {
          result = value;
          break;
        }

        await writer.write(encodeSseDataLine(value));
      }

      await writer.write(encodeSseDataLine({ type: 'done' }));

      logTutorRequestCompleted({
        userId: session.user.id,
        courseSlug: parsed.data.courseSlug,
        lectureId: parsed.data.lectureId,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        usedFallback: result?.outcome.usedFallback,
        filterTriggered: result?.outcome.filterTriggered,
        assessmentBlocked: result?.outcome.assessmentBlocked,
        groundingBlocked: result?.outcome.groundingBlocked,
        grounded: result?.outcome.grounded,
        groundingReason: result?.outcome.groundingReason,
        retrievalChunkCount: result?.outcome.retrievalChunkCount,
      });
    } catch (error) {
      const message =
        error instanceof AskTutorError
          ? error.message
          : 'حدث خطأ أثناء معالجة سؤالك';

      const code =
        error instanceof AskTutorError
          ? error.code
          : AskTutorErrorCodes.UNKNOWN;

      if (!(error instanceof AskTutorError)) {
        console.error('[AI_TUTOR_REQUEST_ERROR]', error);
      }

      logTutorRequestFailed({
        userId: session.user.id,
        courseSlug: parsed.data.courseSlug,
        lectureId: parsed.data.lectureId,
        durationMs: Date.now() - startedAt,
        errorCode: code,
        usedFallback: false,
        filterTriggered: false,
        assessmentBlocked: false,
        retrievalChunkCount: 0,
      });

      await writer.write(
        encodeSseDataLine({
          type: 'error',
          code,
          message,
        }),
      );
    } finally {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      await writer.close();
    }
  })();

  return new Response(readable, { headers: STREAM_HEADERS });
}

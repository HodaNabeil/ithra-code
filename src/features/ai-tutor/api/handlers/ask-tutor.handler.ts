import { auth } from '@/lib/auth';

import { askTutorInputSchema } from '../../application/dto/ask-tutor.dto';
import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  acquireTutorStreamSlot,
  checkTutorMessageRateLimit,
} from '../../infrastructure/guards/tutor-request.guards';
import {
  askTutorUseCase,
  getAskTutorUseCaseDeps,
} from '../../infrastructure/di/ai-tutor-container';

const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
} as const;

function encodeSseEvent(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

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

  try {
    await checkTutorMessageRateLimit(session.user.id);
  } catch (error) {
    if (error instanceof AskTutorError) {
      return Response.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }

    throw error;
  }

  let releaseStreamSlot: (() => Promise<void>) | undefined;

  try {
    releaseStreamSlot = await acquireTutorStreamSlot(session.user.id);
  } catch (error) {
    if (error instanceof AskTutorError) {
      return Response.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }

    throw error;
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  void (async () => {
    try {
      const generator = askTutorUseCase(
        {
          ...parsed.data,
          userId: session.user.id,
        },
        getAskTutorUseCaseDeps(),
      );

      while (true) {
        const { value, done } = await generator.next();
        if (done) {
          break;
        }

        await writer.write(encodeSseEvent(value));
      }

      await writer.write(encodeSseEvent('[DONE]'));
    } catch (error) {
      const message =
        error instanceof AskTutorError
          ? error.message
          : 'حدث خطأ أثناء معالجة سؤالك';

      const code =
        error instanceof AskTutorError
          ? error.code
          : AskTutorErrorCodes.UNKNOWN;

      await writer.write(encodeSseEvent(`[ERROR] ${code}:${message}`));
    } finally {
      await releaseStreamSlot?.();
      await writer.close();
    }
  })();

  return new Response(readable, { headers: STREAM_HEADERS });
}

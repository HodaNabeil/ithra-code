import { auth } from '@/lib/auth';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';

import { evaluateSubmissionInputSchema } from '../../application/dto/evaluate-submission.dto';
import { evaluateSubmissionUseCase } from '../../application/use-cases/evaluate-submission.use-case';

export async function handleEvaluateSubmissionRequest(request: Request): Promise<Response> {
  if (!AIPlatformConfig.isEnabled()) {
    return Response.json(
      { success: false, message: 'AI evaluation is not enabled' },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: 'Authentication required' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = evaluateSubmissionInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request data';
    return Response.json({ success: false, message }, { status: 400 });
  }

  try {
    const result = await evaluateSubmissionUseCase({
      ...parsed.data,
      userId: session.user.id,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation failed';
    return Response.json({ success: false, message }, { status: 500 });
  }
}

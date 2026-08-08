import { handleGetTutorThreadMessagesPaginatedRequest } from '@/features/ai-tutor/api/handlers/get-tutor-thread-messages-paginated.handler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleGetTutorThreadMessagesPaginatedRequest(request, id);
}

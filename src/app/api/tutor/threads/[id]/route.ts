import { handleGetTutorThreadByIdRequest } from '@/features/ai-tutor/api/handlers/get-tutor-thread-by-id.handler';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleGetTutorThreadByIdRequest(_request, id);
}

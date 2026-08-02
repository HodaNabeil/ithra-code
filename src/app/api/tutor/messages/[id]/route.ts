import { handleDeleteTutorMessageRequest } from '@/features/ai-tutor/api/handlers/delete-tutor-message.handler';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleDeleteTutorMessageRequest(request, id);
}

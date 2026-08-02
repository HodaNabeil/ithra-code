import {
  handleDeleteTutorConversationsRequest,
  handleListTutorConversationsRequest,
} from '@/features/ai-tutor/api/handlers/tutor-conversations.handler';

export async function GET(request: Request) {
  return handleListTutorConversationsRequest(request);
}

export async function DELETE(request: Request) {
  return handleDeleteTutorConversationsRequest(request);
}

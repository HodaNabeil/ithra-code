import { handleGetTutorThreadRequest } from '@/features/ai-tutor/api/handlers/get-tutor-thread.handler';

export async function GET(request: Request): Promise<Response> {
  return handleGetTutorThreadRequest(request);
}

import { handleAskTutorRequest } from '@/features/ai-tutor/api/handlers/ask-tutor.handler';

export async function POST(request: Request): Promise<Response> {
  return handleAskTutorRequest(request);
}

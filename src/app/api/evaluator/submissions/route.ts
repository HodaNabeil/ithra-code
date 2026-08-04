import { handleEvaluateSubmissionRequest } from '@/features/ai-assignment-evaluator/api';

export async function POST(request: Request) {
  return handleEvaluateSubmissionRequest(request);
}

import { handleIndexCourseRequest } from '@/features/ai-tutor/api/handlers/index-course.handler';

export async function POST(request: Request): Promise<Response> {
  return handleIndexCourseRequest(request);
}

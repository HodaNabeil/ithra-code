import { getOpenApiDocument } from '@/lib/swagger';

export async function GET() {
  return Response.json(getOpenApiDocument());
}

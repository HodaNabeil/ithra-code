import { randomUUID } from 'node:crypto';

export function resolveCorrelationId(req: Request): string {
  return (
    req.headers.get('x-correlation-id')?.trim() ||
    req.headers.get('x-request-id')?.trim() ||
    randomUUID()
  );
}

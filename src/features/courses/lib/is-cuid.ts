import { z } from 'zod';

const cuidSchema = z.string().cuid();

export function isCuid(value: string): boolean {
  return cuidSchema.safeParse(value).success;
}

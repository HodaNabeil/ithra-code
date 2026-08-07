import { createHash } from 'node:crypto';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g;
const NATIONAL_ID_PATTERN = /\b\d{10,14}\b/g;

function hashValue(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 16);
}

function getPiiSalt(): string {
  return process.env.LANGSMITH_PII_SALT ?? 'ithracode-ai-platform';
}

export function redactPiiText(text: string): string {
  return text
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(PHONE_PATTERN, '[REDACTED_PHONE]')
    .replace(NATIONAL_ID_PATTERN, '[REDACTED_ID]');
}

export function hashIdentifier(value: string): string {
  return `hash:${hashValue(value, getPiiSalt())}`;
}

export function redactTraceInputs(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string') {
      redacted[key] = redactPiiText(value);
      redacted[`${key}Hash`] = hashIdentifier(value);
      redacted[`${key}Length`] = value.length;
      continue;
    }

    redacted[key] = value;
  }

  return redacted;
}

export function redactTraceMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const redacted = { ...metadata };

  if (typeof redacted.userId === 'string') {
    redacted.userId = hashIdentifier(redacted.userId);
  }

  return redacted;
}

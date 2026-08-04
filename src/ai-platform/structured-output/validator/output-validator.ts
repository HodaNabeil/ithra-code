import type { ZodType } from 'zod';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: unknown;
}

export function validateStructuredOutput(
  zodSchema: ZodType,
  raw: unknown,
): ValidationResult {
  const parsed = zodSchema.safeParse(raw);
  if (parsed.success) {
    return { valid: true, errors: [], data: parsed.data };
  }

  return {
    valid: false,
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.join('/') || '/',
      message: issue.message,
    })),
  };
}

export function extractJsonFromText(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // continue to fence extraction
    }
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      return null;
    }
  }

  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart >= 0 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1));
    } catch {
      return null;
    }
  }

  return null;
}

export function repairStructuredOutput(raw: string): { repaired: unknown | null; strategy: string } {
  const extracted = extractJsonFromText(raw);
  if (extracted !== null) {
    return { repaired: extracted, strategy: 'extract_json' };
  }

  return { repaired: null, strategy: 'none' };
}

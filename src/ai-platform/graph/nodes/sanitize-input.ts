const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /user\s*:\s*/gi,
  /<\s*script/gi,
  /<<\s*course_material\s*>>/gi,
  /<<\s*end_course_material\s*>>/gi,
];

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;

export const SANITIZE_INPUT_MAX_CHARS = 5000;

export function sanitizeTutorInput(input: string): string {
  let sanitized = input
    .normalize('NFKC')
    .replace(ZERO_WIDTH_PATTERN, '')
    .trim();
  sanitized = sanitized.replace(/\s+/g, ' ');

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.slice(0, SANITIZE_INPUT_MAX_CHARS);
}

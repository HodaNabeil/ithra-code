import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PromptLocale } from '../ports/prompt-repository.port';

const TEMPLATE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'templates',
);

const LOCAL_VERSION = 'local-v1';

const templateCache = new Map<string, string>();

function templatePath(key: string, locale: PromptLocale): string {
  const normalizedKey = key.replace(/\//g, '.');
  return join(TEMPLATE_DIR, `${normalizedKey}.${locale}.md`);
}

function loadTemplate(key: string, locale: PromptLocale): string | null {
  const cacheKey = `${key}:${locale}`;
  const cached = templateCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const path = templatePath(key, locale);
  if (!existsSync(path)) {
    const fallbackPath = templatePath(key, 'en');
    if (!existsSync(fallbackPath)) {
      return null;
    }
    const content = readFileSync(fallbackPath, 'utf-8').trim();
    templateCache.set(cacheKey, content);
    return content;
  }

  const content = readFileSync(path, 'utf-8').trim();
  templateCache.set(cacheKey, content);
  return content;
}

export function substituteVariables(
  content: string,
  variables: Record<string, string> = {},
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    return variables[name] ?? `{{${name}}}`;
  });
}

export function getLocalTemplate(
  key: string,
  locale: PromptLocale,
  variables?: Record<string, string>,
): { content: string; version: string } | null {
  const raw = loadTemplate(key, locale);
  if (!raw) {
    return null;
  }

  return {
    content: substituteVariables(raw, variables),
    version: LOCAL_VERSION,
  };
}

export function listLocalTemplateKeys(): string[] {
  return [
    'tutor/system',
    'tutor/assessment-boundary',
    'tutor/session-context',
    'tutor/rag-fallback',
    'evaluator/system',
    'evaluator/rubric',
  ];
}

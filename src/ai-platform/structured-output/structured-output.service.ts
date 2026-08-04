import type { LlmPort } from '../domain/ports/llm.port';
import { getOutputSchema } from './registry/schema-registry';
import {
  repairStructuredOutput,
  validateStructuredOutput,
  type ValidationError,
  type ValidationResult,
} from './validator/output-validator';

export interface StructuredOutputRequest {
  schemaId: string;
  schemaVersion?: number;
  systemPrompt: string;
  userPrompt: string;
  locale?: 'ar' | 'en';
  maxAttempts?: number;
}

export interface StructuredOutputResult<T = unknown> {
  schemaId: string;
  schemaVersion: number;
  status: 'valid' | 'repaired' | 'rejected';
  data?: T;
  confidence: number;
  rawOutput: string;
  attempts: number;
  errors: ValidationResult['errors'];
}

export async function generateStructuredOutput<T>(
  llmPort: LlmPort,
  request: StructuredOutputRequest,
): Promise<StructuredOutputResult<T>> {
  const schema = getOutputSchema(request.schemaId, request.schemaVersion);
  if (!schema) {
    throw new Error(`Schema not found: ${request.schemaId}`);
  }

  const maxAttempts = request.maxAttempts ?? 3;
  let lastRaw = '';
  let lastErrors: ValidationResult['errors'] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const errorContext =
      lastErrors.length > 0
        ? `\n\nPrevious validation errors:\n${lastErrors
            .map((error: ValidationError) => `${error.path}: ${error.message}`)
            .join('\n')}`
        : '';

    const complete = llmPort.complete;
    if (!complete) {
      throw new Error('LLM port does not support complete() for structured output');
    }

    const response = await complete({
      systemPrompt: request.systemPrompt,
      messages: [{ role: 'user', content: `${request.userPrompt}${errorContext}` }],
      responseFormat: 'json',
      jsonSchema: schema.jsonSchema,
      temperature: 0.2,
      maxTokens: 2000,
    });

    lastRaw = response.content;
    let parsedValue: unknown = lastRaw;
    try {
      parsedValue = JSON.parse(lastRaw);
    } catch {
      // keep as string for repair path
    }

    const directValidation = validateStructuredOutput(schema.zodSchema, parsedValue);
    if (directValidation.valid) {
      return {
        schemaId: schema.id,
        schemaVersion: schema.version,
        status: 'valid',
        data: directValidation.data as T,
        confidence: 0.95,
        rawOutput: lastRaw,
        attempts: attempt,
        errors: [],
      };
    }

    const repair = repairStructuredOutput(lastRaw);
    if (repair.repaired !== null) {
      const repairedValidation = validateStructuredOutput(schema.zodSchema, repair.repaired);
      if (repairedValidation.valid) {
        return {
          schemaId: schema.id,
          schemaVersion: schema.version,
          status: 'repaired',
          data: repairedValidation.data as T,
          confidence: 0.8,
          rawOutput: lastRaw,
          attempts: attempt,
          errors: [],
        };
      }
      parsedValue = repair.repaired;
      lastErrors = repairedValidation.errors;
    } else {
      lastErrors = directValidation.errors;
    }

    if (parsedValue !== null && typeof parsedValue !== 'string') {
      const validation = validateStructuredOutput(schema.zodSchema, parsedValue);
      lastErrors = validation.errors;
    }
  }

  return {
    schemaId: schema.id,
    schemaVersion: schema.version,
    status: 'rejected',
    confidence: 0,
    rawOutput: lastRaw,
    attempts: maxAttempts,
    errors: lastErrors,
  };
}

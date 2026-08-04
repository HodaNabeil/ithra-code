import { z } from 'zod';

import type { ToolDefinition } from '../types';

const calculatorInputSchema = z.object({
  expression: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[0-9+\-*/().%\s^]+$/, 'Expression contains unsupported characters'),
});

const calculatorOutputSchema = z.object({
  result: z.number(),
});

export const calculatorToolDefinition: ToolDefinition = {
  id: 'calculator',
  name: 'Calculator',
  description: 'Evaluate safe mathematical expressions (+, -, *, /, %, parentheses)',
  source: 'builtin',
  inputSchema: calculatorInputSchema,
  outputSchema: calculatorOutputSchema,
  timeout: 5_000,
  requiresAuth: false,
};

function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let current = '';

  for (const char of expression.replace(/\s+/g, '')) {
    if (/[0-9.]/.test(char)) {
      current += char;
    } else {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function evaluateTokens(tokens: string[]): number {
  let index = 0;

  function parseNumber(): number {
    const token = tokens[index];
    if (token === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      index += 1;
      return value;
    }

    const value = Number(token);
    if (Number.isNaN(value)) {
      throw new Error('Invalid number');
    }
    index += 1;
    return value;
  }

  function parseFactor(): number {
    let value = parseNumber();
    while (tokens[index] === '%') {
      index += 1;
      value /= 100;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const op = tokens[index];
      index += 1;
      const right = parseFactor();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const op = tokens[index];
      index += 1;
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (index !== tokens.length) {
    throw new Error('Unexpected tokens in expression');
  }
  return result;
}

export async function calculatorToolHandler(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const parsed = calculatorInputSchema.parse(input);
  const tokens = tokenize(parsed.expression);
  const result = evaluateTokens(tokens);

  if (!Number.isFinite(result)) {
    throw new Error('Expression result is not finite');
  }

  return { result };
}

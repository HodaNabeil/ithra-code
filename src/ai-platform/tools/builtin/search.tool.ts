import { z } from 'zod';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  getEmbeddingPort,
  getVectorSearchPort,
} from '../../infrastructure/di/ai-platform.container';
import {
  getWorkingMemory,
  setWorkingMemory,
} from '../../memory/short-term/working-memory.cache';
import type { ToolContext } from '../types';
import type { ToolDefinition } from '../types';

function searchCacheScope(
  query: string,
  courseId: string,
  topK?: number,
): string {
  return `tool:search:${courseId}:${topK ?? 'default'}:${query}`;
}

function resolveRuntimeCourseId(context: ToolContext): string {
  const courseId = context.scope?.courseId ?? context.courseId;
  if (!courseId) {
    throw new Error('Course scope is required for knowledge search');
  }
  return courseId;
}

const searchInputSchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(20).optional(),
});

const searchOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      score: z.number(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

export const searchToolDefinition: ToolDefinition = {
  id: 'search',
  name: 'Knowledge Search',
  description:
    'Search the current course knowledge base for relevant educational content',
  source: 'builtin',
  inputSchema: searchInputSchema,
  outputSchema: searchOutputSchema,
  timeout: 10_000,
  requiresAuth: true,
};

export async function searchToolHandler(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<Record<string, unknown>> {
  const parsed = searchInputSchema.parse(input);
  const courseId = resolveRuntimeCourseId(context);
  const scope = searchCacheScope(parsed.query, courseId, parsed.topK);

  const cached = await getWorkingMemory(context.agentRunId, scope);
  if (cached && Array.isArray(cached.results)) {
    return cached;
  }

  const retrievalConfig = AIPlatformConfig.getRetrievalConfig();
  const embeddingPort = getEmbeddingPort();
  const vectorSearchPort = getVectorSearchPort();

  const embeddingResult = await embeddingPort.generateEmbedding(parsed.query);
  const results = await vectorSearchPort.search(embeddingResult.embedding, {
    topK: parsed.topK ?? retrievalConfig.topK,
    minScore: retrievalConfig.minSimilarity,
    filter: {
      courseId,
      lectureId: context.scope?.lectureId,
    },
  });

  const output = {
    results: results.map((result) => ({
      id: result.id,
      content: result.content,
      score: result.score,
      metadata: result.metadata,
    })),
  };

  await setWorkingMemory(context.agentRunId, scope, output);

  return output;
}

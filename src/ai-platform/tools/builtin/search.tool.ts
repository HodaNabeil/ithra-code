import { z } from 'zod';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  getEmbeddingPort,
  getVectorSearchPort,
} from '../../infrastructure/di/ai-platform.container';
import type { ToolContext } from '../types';
import type { ToolDefinition } from '../types';

const searchInputSchema = z.object({
  query: z.string().min(1).max(2000),
  courseId: z.string().min(1),
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
  description: 'Search the course knowledge base for relevant content',
  source: 'builtin',
  inputSchema: searchInputSchema,
  outputSchema: searchOutputSchema,
  timeout: 10_000,
  requiresAuth: true,
};

export async function searchToolHandler(
  input: Record<string, unknown>,
  _context: ToolContext,
): Promise<Record<string, unknown>> {
  const parsed = searchInputSchema.parse(input);
  const retrievalConfig = AIPlatformConfig.getRetrievalConfig();
  const embeddingPort = getEmbeddingPort();
  const vectorSearchPort = getVectorSearchPort();

  const embeddingResult = await embeddingPort.generateEmbedding(parsed.query);
  const results = await vectorSearchPort.search(embeddingResult.embedding, {
    topK: parsed.topK ?? retrievalConfig.topK,
    minScore: retrievalConfig.minSimilarity,
    filter: { courseId: parsed.courseId },
  });

  return {
    results: results.map((result) => ({
      id: result.id,
      content: result.content,
      score: result.score,
      metadata: result.metadata,
    })),
  };
}

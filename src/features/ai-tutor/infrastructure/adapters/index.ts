/**
 * AI Tutor Adapters
 *
 * Feature-specific adapter implementations.
 *
 * - PostgresVectorSearchAdapter (via ai-platform)
 * - EducationalContentFilter (Sprint 7)
 */

export {
  PostgresVectorSearchAdapter,
  postgresVectorSearchAdapter,
} from '@/ai-platform/rag/retrieval/postgres-vector-search.adapter';
export {
  EducationalContentFilter,
  educationalContentFilter,
} from './EducationalContentFilter';

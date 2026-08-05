/**
 * AI Tutor Port Interfaces
 *
 * All external dependencies are abstracted through ports.
 * This enables:
 * - Easy testing with mocks
 * - Provider switching without code changes
 * - Provider-agnostic architecture
 *
 * Import ports here for easy access:
 * import { LlmPort, EmbeddingPort } from '@/features/ai-tutor/domain/ports';
 */

export * from './EmbeddingPort';
export * from './ConversationRepositoryPort';
export * from './ContentFilterPort';
export * from './KnowledgeChunkRepositoryPort';
export * from './CourseContextRepositoryPort';
export * from './StudentLearningProfileRepositoryPort';
export * from './CourseContentRepositoryPort';
export * from './SessionContextCachePort';

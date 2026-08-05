/**
 * AI Platform — public API surface.
 * Features must import only from `@/ai-platform`.
 */

import { chat, chatStream, runAgent, streamAgent } from './application/use-cases/chat.use-case';
import { routeSupervisorRequest } from './application/use-cases/supervisor.use-case';
import { AIPlatformConfig } from './infrastructure/config/ai-platform.config';

export const ai = {
  chat,
  chatStream,
  isEnabled: () => AIPlatformConfig.isEnabled(),
};

export { runAgent, streamAgent, routeSupervisorRequest };
export { getCostSummary } from './observability/cost/cost-ledger.service';
export type { CostFilters, CostSummary } from './observability/cost/cost-ledger.service';
export { getCachedEmbedding, setCachedEmbedding } from './embeddings/cache/embedding-cache';
export { embedRecords } from './embeddings/pipeline';
export {
  bullmqCourseKnowledgeIndexer,
  createCourseKnowledgeIndexer,
} from './indexing/pipelines/enqueue';
export { bootstrapUnindexedCourseIndexing } from './indexing/pipelines/bootstrap';
export { handleCourseIndexingJob } from './indexing/workers/course-indexing.handler';
export {
  runCourseIndexing,
  runLectureIndexing,
  type CourseIndexingDeps,
  type CourseIndexingResult,
  type LectureIndexingResult,
} from './indexing/pipelines/course-indexing.pipeline';
export {
  buildCourseIndexingJobId,
  COURSE_INDEXING_QUEUE,
  type CourseIndexingRequestedEvent,
} from './indexing/constants';
export { AIPlatformConfig, validateAIPlatformConfig } from './infrastructure/config/ai-platform.config';
export {
  assertMessageRateLimit,
  acquireConcurrencySlot,
  assertGlobalDailyCostCap,
} from './infrastructure/guards';
export {
  probePlatformInfrastructure,
  validatePlatformInfrastructure,
} from './infrastructure/startup/validate-platform-infrastructure';
export { tutorAgentDefinition } from './agents/tutor/tutor-agent.definition';
export {
  evaluatorAgentDefinition,
  codeReviewerAgentDefinition,
  supervisorAgentDefinition,
  detectSupervisorRoute,
} from './agents/evaluator/evaluator-agent.definition';
export { getAgentDefinition, listAgents } from './agents/definitions/agent-registry';
export { compileAgentGraph } from './graph/compiler/graph-compiler';
export { getMemoryStorePort } from './infrastructure/di/ai-platform.container';
export {
  getCourseIndexingDeps,
  getCourseContentRepository,
  getKnowledgeChunkRepository,
  getKnowledgeSourceHashRepository,
} from './infrastructure/di/ai-platform.container';
export { getCourseIndexingQueueMetrics } from './infrastructure/queue/course-indexing-queue-metrics';
export type { CourseIndexingQueueMetrics } from './infrastructure/queue/course-indexing-queue-metrics';
export type {
  CourseContentRepositoryPort,
  CourseForIndexingDTO,
} from './indexing/domain/ports/CourseContentRepositoryPort';
export type {
  KnowledgeChunkRepositoryPort,
} from './indexing/domain/ports/KnowledgeChunkRepositoryPort';
export type {
  KnowledgeSourceHashRepositoryPort,
  KnowledgeSourceHashRecord,
} from './indexing/domain/ports/KnowledgeSourceHashRepositoryPort';
export type {
  KnowledgeChunkRecord,
  IndexedKnowledgeChunk,
} from './indexing/domain/models/KnowledgeChunk';
export { isExtractionSkipped } from './indexing/domain/models/KnowledgeSource';
export type { EducationalContentValidatorPort } from './graph/runtime-config';
export type { ResponseProcessorPort } from './domain/ports/response-processor.port';
export type { ResponseEnricherPort } from './domain/ports/response-enricher.port';
export type {
  AgentExecutionState,
  ExecutionPolicy,
} from './graph/state/shared-channels';
export { readExecutionPolicy } from './graph/state/shared-channels';
export { generateStructuredOutput } from './structured-output/structured-output.service';
export type { EvaluatorRubricV1 } from './structured-output/schemas/evaluator-rubric.v1';
export { executeTool } from './tools/executor/tool-executor';
export { listTools } from './tools/registry/tool-registry';

export { PlatformError, PlatformErrorCodes } from './shared/errors';
export type {
  ChatMessage,
  ChatMessageRole,
  ChatOptions,
  ChatResult,
  ChatScope,
  ChatStreamEvent,
  ChatUsage,
  RetrievedSource,
} from './shared/types';
export type { ChatRequest } from './application/dto/chat.dto';
export type {
  AgentDefinition,
  AgentRunRequest,
  AgentRunResult,
  AgentScope,
} from './agents/base/agent-definition';
export type {
  MemoryFact,
  MemoryQuery,
  MemoryStorePort,
} from './domain/ports/memory-store.port';

export type {
  LlmPort,
  EmbeddingPort,
  VectorSearchPort,
  LlmMessage,
  EmbeddingResult,
  SearchResult,
} from './domain/ports';

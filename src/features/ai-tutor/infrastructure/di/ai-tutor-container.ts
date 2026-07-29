import { AITutorConfig, validateAITutorConfig } from '../config/ai-tutor.config';
import { OpenAILlmAdapter } from '../adapters/OpenAILlmAdapter';
import { OpenAIEmbeddingAdapter } from '../adapters/OpenAIEmbeddingAdapter';
import { postgresVectorSearchAdapter } from '../adapters/PostgresVectorSearchAdapter';
import {
  EducationalContentFilter,
  educationalContentFilter,
} from '../adapters/EducationalContentFilter';
import { prismaConversationRepository } from '../repositories/PrismaConversationRepository';
import { prismaKnowledgeChunkRepository } from '../repositories/PrismaKnowledgeChunkRepository';
import { prismaCourseContextRepository } from '../repositories/PrismaCourseContextRepository';
import { prismaStudentLearningProfileRepository } from '../repositories/PrismaStudentLearningProfileRepository';
import { prismaCourseContentRepository } from '../repositories/PrismaCourseContentRepository';
import type { LlmPort } from '../../domain/ports/LlmPort';
import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { VectorSearchPort } from '../../domain/ports/VectorSearchPort';
import type { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import type { KnowledgeChunkRepositoryPort } from '../../domain/ports/KnowledgeChunkRepositoryPort';
import type { CourseContextRepositoryPort } from '../../domain/ports/CourseContextRepositoryPort';
import type { StudentLearningProfileRepositoryPort } from '../../domain/ports/StudentLearningProfileRepositoryPort';
import type { CourseContentRepositoryPort } from '../../domain/ports/CourseContentRepositoryPort';
import type { SessionContextCachePort } from '../../domain/ports/SessionContextCachePort';
import {
  askTutorUseCase,
  type AskTutorUseCaseDeps,
} from '../../application/use-cases/ask-tutor.use-case';
import {
  getTutorThreadMessagesUseCase,
  type GetTutorThreadMessagesUseCaseDeps,
} from '../../application/use-cases/get-tutor-thread-messages.use-case';
import {
  indexCourseUseCase,
  type IndexCourseUseCaseDeps,
} from '../../application/use-cases/index-course.use-case';
import type { CourseContextServiceDeps } from '../../application/services/course-context.service';
import { redisSessionContextCache } from '../cache/redis-session-context.cache';

type AITutorGlobalState = {
  llmPort?: LlmPort;
  embeddingPort?: EmbeddingPort;
  vectorSearchPort?: VectorSearchPort;
  contentFilter?: ContentFilterPort;
};

const globalForAITutor = globalThis as typeof globalThis & {
  __aiTutorState?: AITutorGlobalState;
};

function getState(): AITutorGlobalState {
  if (!globalForAITutor.__aiTutorState) {
    globalForAITutor.__aiTutorState = {};
  }
  return globalForAITutor.__aiTutorState;
}

export function assertAITutorEnabled(): void {
  if (!AITutorConfig.isEnabled()) {
    throw new Error('AI Tutor feature is disabled');
  }

  validateAITutorConfig();
}

export function getLlmPort(): LlmPort {
  assertAITutorEnabled();
  const state = getState();

  if (!state.llmPort) {
    const llmConfig = AITutorConfig.getLlmConfig();
    state.llmPort = new OpenAILlmAdapter(AITutorConfig.getLlmApiKey(), {
      baseURL: llmConfig.baseURL,
      model: llmConfig.model,
    });
  }

  return state.llmPort;
}

export function getEmbeddingPort(): EmbeddingPort {
  assertAITutorEnabled();
  const state = getState();

  if (!state.embeddingPort) {
    const embeddingConfig = AITutorConfig.getEmbeddingConfig();
    state.embeddingPort = new OpenAIEmbeddingAdapter(AITutorConfig.getLlmApiKey(), {
      baseURL: embeddingConfig.baseURL,
      model: embeddingConfig.model,
    });
  }

  return state.embeddingPort;
}

export function getVectorSearchPort(): VectorSearchPort {
  assertAITutorEnabled();
  const state = getState();

  if (!state.vectorSearchPort) {
    state.vectorSearchPort = postgresVectorSearchAdapter;
  }

  return state.vectorSearchPort;
}

export function getContentFilter(): ContentFilterPort {
  assertAITutorEnabled();
  const state = getState();

  if (!state.contentFilter) {
    state.contentFilter = educationalContentFilter;
  }

  return state.contentFilter;
}

export function getConversationRepository(): ConversationRepositoryPort {
  assertAITutorEnabled();
  return prismaConversationRepository;
}

export function getKnowledgeChunkRepository(): KnowledgeChunkRepositoryPort {
  assertAITutorEnabled();
  return prismaKnowledgeChunkRepository;
}

export function getCourseContextRepository(): CourseContextRepositoryPort {
  assertAITutorEnabled();
  return prismaCourseContextRepository;
}

export function getStudentLearningProfileRepository(): StudentLearningProfileRepositoryPort {
  assertAITutorEnabled();
  return prismaStudentLearningProfileRepository;
}

export function getCourseContentRepository(): CourseContentRepositoryPort {
  assertAITutorEnabled();
  return prismaCourseContentRepository;
}

export function getSessionContextCache(): SessionContextCachePort {
  assertAITutorEnabled();
  return redisSessionContextCache;
}

export function getSessionContextDeps(): CourseContextServiceDeps {
  return {
    courseContextRepository: getCourseContextRepository(),
    studentLearningProfileRepository: getStudentLearningProfileRepository(),
    sessionContextCache: getSessionContextCache(),
  };
}

export function getAskTutorUseCaseDeps(): AskTutorUseCaseDeps {
  return {
    ...getSessionContextDeps(),
    llmPort: getLlmPort(),
    conversationRepository: getConversationRepository(),
    embeddingPort: getEmbeddingPort(),
    vectorSearchPort: getVectorSearchPort(),
    contentFilter: getContentFilter(),
    vectorSearchConfig: AITutorConfig.getVectorSearchConfig(),
  };
}

export function getTutorThreadMessagesUseCaseDeps(): GetTutorThreadMessagesUseCaseDeps {
  return {
    ...getSessionContextDeps(),
    conversationRepository: getConversationRepository(),
  };
}

export function getIndexCourseUseCaseDeps(): IndexCourseUseCaseDeps {
  return {
    embeddingPort: getEmbeddingPort(),
    knowledgeChunkRepository: getKnowledgeChunkRepository(),
    courseContentRepository: getCourseContentRepository(),
  };
}

export {
  askTutorUseCase,
  getTutorThreadMessagesUseCase,
  indexCourseUseCase,
  EducationalContentFilter,
};

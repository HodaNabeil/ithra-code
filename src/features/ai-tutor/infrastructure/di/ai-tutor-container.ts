import { AITutorConfig, validateAITutorConfig } from '../config/ai-tutor.config';
import { getEmbeddingPort as getPlatformEmbeddingPort } from '@/ai-platform/infrastructure/di/ai-platform.container';
import {
  EducationalContentFilter,
  educationalContentFilter,
} from '../adapters/EducationalContentFilter';
import { prismaConversationRepository } from '../repositories/PrismaConversationRepository';
import { prismaKnowledgeChunkRepository } from '../repositories/PrismaKnowledgeChunkRepository';
import { prismaKnowledgeSourceHashRepository } from '../repositories/PrismaKnowledgeSourceHashRepository';
import { prismaCourseContextRepository } from '../repositories/PrismaCourseContextRepository';
import { prismaStudentLearningProfileRepository } from '../repositories/PrismaStudentLearningProfileRepository';
import { prismaCourseContentRepository } from '../repositories/PrismaCourseContentRepository';
import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import type { KnowledgeChunkRepositoryPort } from '../../domain/ports/KnowledgeChunkRepositoryPort';
import type { CourseContextRepositoryPort } from '../../domain/ports/CourseContextRepositoryPort';
import type { StudentLearningProfileRepositoryPort } from '../../domain/ports/StudentLearningProfileRepositoryPort';
import type { KnowledgeSourceHashRepositoryPort } from '../../domain/ports/KnowledgeSourceHashRepositoryPort';
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

export function getEmbeddingPort(): EmbeddingPort {
  assertAITutorEnabled();
  return getPlatformEmbeddingPort();
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

export function getKnowledgeSourceHashRepository(): KnowledgeSourceHashRepositoryPort {
  assertAITutorEnabled();
  return prismaKnowledgeSourceHashRepository;
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
    conversationRepository: getConversationRepository(),
    contentFilter: getContentFilter(),
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
    hashRepository: getKnowledgeSourceHashRepository(),
    courseContentRepository: getCourseContentRepository(),
  };
}

export {
  askTutorUseCase,
  getTutorThreadMessagesUseCase,
  indexCourseUseCase,
  EducationalContentFilter,
};

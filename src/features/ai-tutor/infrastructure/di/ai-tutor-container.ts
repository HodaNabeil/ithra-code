import { AITutorConfig, validateAITutorConfig } from '../config/ai-tutor.config';
import {
  getCourseIndexingDeps,
  getCourseContentRepository,
  getEmbeddingPort as getPlatformEmbeddingPort,
} from '@/ai-platform/infrastructure/di/ai-platform.container';
import {
  EducationalContentFilter,
  educationalContentFilter,
} from '../adapters/EducationalContentFilter';
import { prismaConversationRepository } from '../repositories/PrismaConversationRepository';
import { prismaCourseContextRepository } from '../repositories/PrismaCourseContextRepository';
import { prismaStudentLearningProfileRepository } from '../repositories/PrismaStudentLearningProfileRepository';
import type { EmbeddingPort } from '@/ai-platform';
import type { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import type { CourseContextRepositoryPort } from '../../domain/ports/CourseContextRepositoryPort';
import type { StudentLearningProfileRepositoryPort } from '../../domain/ports/StudentLearningProfileRepositoryPort';
import type { SessionContextCachePort } from '../../domain/ports/SessionContextCachePort';
import type { IndexCourseUseCaseDeps } from '../../application/use-cases/index-course.use-case';
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

export function getCourseContextRepository(): CourseContextRepositoryPort {
  assertAITutorEnabled();
  return prismaCourseContextRepository;
}

export function getStudentLearningProfileRepository(): StudentLearningProfileRepositoryPort {
  assertAITutorEnabled();
  return prismaStudentLearningProfileRepository;
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
    ...getCourseIndexingDeps(),
    courseContentRepository: getCourseContentRepository(),
  };
}

export {
  askTutorUseCase,
  getTutorThreadMessagesUseCase,
  indexCourseUseCase,
  EducationalContentFilter,
};

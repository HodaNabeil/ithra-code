import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PlatformErrorCodes } from '@/ai-platform/shared/errors';
import { mapPlatformErrorToAskTutorError } from '@/features/ai-tutor/infrastructure/guards/platform-error.mapper';
import {
  AskTutorErrorCodes,
} from '@/features/ai-tutor/application/errors/ask-tutor.errors';
import { buildAgentContext } from '@/ai-platform/application/runtime/context-builder';
import { tutorAgentDefinition } from '@/ai-platform/agents/tutor/tutor-agent.definition';
import type { TutorAgentState } from '@/ai-platform/graph/state/tutor-agent.state';

describe('ask tutor — platform runtime integration', () => {
  it('maps rate limit platform errors to tutor errors', () => {
    const error = mapPlatformErrorToAskTutorError({
      type: 'error',
      code: PlatformErrorCodes.RATE_LIMITED,
      message: 'تم تجاوز الحد',
    });

    assert.equal(error.status, 429);
    assert.equal(error.code, AskTutorErrorCodes.RATE_LIMIT_EXCEEDED);
  });

  it('maps AI disabled platform errors to service unavailable', () => {
    const error = mapPlatformErrorToAskTutorError({
      type: 'error',
      code: PlatformErrorCodes.AI_DISABLED,
      message: 'AI Platform is disabled',
    });

    assert.equal(error.status, 503);
    assert.equal(error.code, AskTutorErrorCodes.SERVICE_UNAVAILABLE);
  });

  it('maps concurrency limit errors to tutor errors', () => {
    const error = mapPlatformErrorToAskTutorError({
      type: 'error',
      code: PlatformErrorCodes.CONCURRENCY_LIMIT,
      message: 'too many streams',
    });

    assert.equal(error.status, 429);
    assert.equal(error.code, AskTutorErrorCodes.CONCURRENT_STREAM_LIMIT);
  });

  it('accepts tutor-v1 metadata payload used by ask-tutor use case (history + personalization only)', () => {
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'student-1',
      input: 'اشرح المتغيرات',
      locale: 'ar',
      scope: {
        userId: 'student-1',
        courseId: 'course-1',
        lectureId: 'lecture-1',
        threadId: 'thread-1',
        conversationId: 'conversation-1',
      },
      options: {
        maxTokens: 402,
        metadata: {
          conversationHistory: [{ role: 'user', content: 'مرحبا' }],
          personalization: {
            studentName: 'أحمد',
            courseTitle: 'أساسيات البرمجة',
          },
          promptVersion: 'tutor-v1',
        },
      },
    });

    assert.equal(built.promptVersion, 'tutor-v1');
    const state = built.initialState as TutorAgentState;
    assert.equal(state.input, 'اشرح المتغيرات');
    assert.equal(state.conversationHistory[0]?.content, 'مرحبا');
    assert.equal(state.personalization?.studentName, 'أحمد');
    // RAG is fetched by retrieve-context.node.ts using the graph's ports, not from metadata.
    assert.equal(state.retrievedChunks.length, 0);
  });
});

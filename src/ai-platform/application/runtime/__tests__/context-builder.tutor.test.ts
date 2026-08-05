import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildAgentContext } from '@/ai-platform/application/runtime/context-builder';
import { tutorAgentDefinition } from '@/ai-platform/agents/tutor/tutor-agent.definition';
import type { TutorAgentState } from '@/ai-platform/graph/state/tutor-agent.state';

describe('context builder — tutor metadata', () => {
  it('populates tutor state from request metadata (history + personalization only)', () => {
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'user-1',
      input: 'ما هي الحلقات؟',
      locale: 'ar',
      scope: {
        userId: 'user-1',
        courseId: 'course-1',
        lectureId: 'lecture-1',
        threadId: 'thread-1',
      },
      options: {
        metadata: {
          conversationHistory: [
            { role: 'user', content: 'مرحبا' },
            { role: 'assistant', content: 'أهلاً' },
          ],
          personalization: {
            studentName: 'سارة',
            learningLevel: 'متوسط',
          },
          promptVersion: 'tutor-v1',
        },
      },
    });

    assert.equal(built.promptVersion, 'tutor-v1');
    const state = built.initialState as TutorAgentState;
    assert.equal(state.agentId, 'tutor');
    assert.match(state.systemPrompt, /مدرس ذكي/);
    assert.equal(state.conversationHistory.length, 2);
    assert.equal(state.personalization?.studentName, 'سارة');
    // RAG chunks are always fetched inside the graph (retrieve-context.node.ts),
    // never accepted pre-built from feature-layer metadata.
    assert.equal(state.retrievedChunks.length, 0);
  });

  it('does not accept a pre-built systemPrompt or retrievedChunks from metadata', () => {
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'user-1',
      input: 'سؤال',
      locale: 'ar',
      scope: { userId: 'user-1' },
      options: {
        metadata: {
          conversationHistory: [],
          systemPrompt: 'يجب تجاهل هذا',
          retrievedChunks: [{ id: 'ignored', content: 'ignored', score: 1 }],
        },
      },
    });

    const state = built.initialState as TutorAgentState;
    assert.match(state.systemPrompt, /مدرس ذكي/);
    assert.notEqual(state.systemPrompt, 'يجب تجاهل هذا');
    assert.equal(state.retrievedChunks.length, 0);
  });

  it('falls back to generic tutor defaults when metadata is missing', () => {
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'user-1',
      input: 'سؤال',
      locale: 'ar',
      scope: { userId: 'user-1' },
    });

    assert.equal(built.promptVersion, 'local-v1');
    const state = built.initialState as TutorAgentState;
    assert.equal(state.conversationHistory.length, 0);
    assert.equal(state.retrievedChunks.length, 0);
    assert.equal(state.personalization, undefined);
    assert.match(state.systemPrompt, /مدرس ذكي/);
  });

  it('ignores invalid tutor metadata', () => {
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'user-1',
      input: 'سؤال',
      locale: 'ar',
      scope: { userId: 'user-1' },
      options: {
        metadata: {
          conversationHistory: 'not-an-array',
        },
      },
    });

    const state = built.initialState as TutorAgentState;
    assert.equal(state.conversationHistory.length, 0);
    assert.match(state.systemPrompt, /مدرس ذكي/);
  });
});

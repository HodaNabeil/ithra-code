import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildAgentContext } from '@/ai-platform/application/runtime/context-builder';
import { tutorAgentDefinition } from '@/ai-platform/agents/tutor/tutor-agent.definition';
import type { TutorAgentState } from '@/ai-platform/graph/state/tutor-agent.state';

describe('context builder — tutor metadata', () => {
  it('populates tutor state from request metadata', () => {
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
          systemPrompt: 'أنت مدرس ذكي',
          conversationHistory: [
            { role: 'user', content: 'مرحبا' },
            { role: 'assistant', content: 'أهلاً' },
          ],
          retrievedChunks: [
            {
              id: 'chunk-1',
              content: 'محتوى المحاضرة',
              score: 0.9,
              metadata: { title: 'الدرس 1' },
            },
          ],
          promptVersion: 'tutor-v1',
        },
      },
    });

    assert.equal(built.promptVersion, 'tutor-v1');
    const state = built.initialState as TutorAgentState;
    assert.equal(state.agentId, 'tutor');
    assert.equal(state.systemPrompt, 'أنت مدرس ذكي');
    assert.equal(state.conversationHistory.length, 2);
    assert.equal(state.retrievedChunks.length, 1);
    assert.equal(state.retrievedChunks[0]?.id, 'chunk-1');
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
          systemPrompt: 123,
        },
      },
    });

    const state = built.initialState as TutorAgentState;
    assert.equal(state.conversationHistory.length, 0);
    assert.match(state.systemPrompt, /مدرس ذكي/);
  });
});

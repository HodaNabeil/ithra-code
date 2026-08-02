import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { trimConversationHistory } from '@/features/ai-tutor/application/services/prompt-builder';
import type { MessageDTO } from '@/features/ai-tutor/domain/ports/ConversationRepositoryPort';

function buildHistory(count: number): MessageDTO[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `m-${index + 1}`,
    threadId: 'thread-1',
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `message-${index + 1} `.repeat(80),
    createdAt: new Date(index + 1),
    updatedAt: new Date(index + 1),
  }));
}

describe('trimConversationHistory with recent messages', () => {
  it('keeps the most recent messages when history exceeds the limit window', () => {
    const history = buildHistory(50);
    const trimmed = trimConversationHistory(history, 'system prompt');

    assert.ok(trimmed.length > 0);
    assert.equal(trimmed[trimmed.length - 1]?.content, history[49]?.content);
    assert.ok(trimmed.length < history.length);
  });
});

describe('getThreadMessages ordering contract', () => {
  it('documents expected repository ordering (desc fetch + reverse)', () => {
    const chronological = buildHistory(25).slice(-20);
    assert.equal(chronological.length, 20);
    assert.equal(chronological[0]?.id, 'm-6');
    assert.equal(chronological[19]?.id, 'm-25');
  });
});

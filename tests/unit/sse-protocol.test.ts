import { describe, expect, it } from 'vitest';

import {
  encodeSseCommentLine,
  encodeSseDataLine,
  parseTutorSseEvent,
} from '@/features/ai-tutor/shared/sse-protocol';

describe('sse protocol', () => {
  it('round-trips semantic events', () => {
    const encoded = encodeSseDataLine({
      type: 'meta',
      threadId: 'thread-1',
      conversationId: 'conv-1',
      turnId: 'turn-1',
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      sources: [],
      usedFallback: false,
    });

    const text = new TextDecoder().decode(encoded);
    const payload = text.trim().replace(/^data:\s*/, '');
    const parsed = parseTutorSseEvent(payload);

    expect(parsed?.type).toBe('meta');
    if (parsed?.type === 'meta') {
      expect(parsed.threadId).toBe('thread-1');
      expect(parsed.turnId).toBe('turn-1');
    }
  });

  it('keeps comment heartbeats separate from data events', () => {
    const comment = new TextDecoder().decode(encodeSseCommentLine('ping'));
    expect(comment).toBe(': ping\n\n');
    expect(parseTutorSseEvent('ping')).toBeNull();
  });
});

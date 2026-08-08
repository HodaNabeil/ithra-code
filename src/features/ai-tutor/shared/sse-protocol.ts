import type { MessageSourceDTO } from '../application/dto/message-source.dto';

/**
 * JSON-encoded SSE event payloads for the AI Tutor chat stream.
 * Each event is sent as `data: ${JSON.stringify(event)}\n\n`.
 */
export type TutorSseEvent =
  | { type: 'token'; text: string }
  | {
      type: 'meta';
      threadId?: string;
      conversationId?: string;
      turnId?: string;
      userMessageId?: string;
      assistantMessageId?: string;
      sources: MessageSourceDTO[];
      usedFallback: boolean;
      educationalFilterApplied?: boolean;
    }
  | { type: 'replace'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export function encodeTutorSseEvent(event: TutorSseEvent): string {
  return JSON.stringify(event);
}

export function parseTutorSseEvent(payload: string): TutorSseEvent | null {
  try {
    const parsed = JSON.parse(payload) as TutorSseEvent;
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function encodeSseDataLine(event: TutorSseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${encodeTutorSseEvent(event)}\n\n`);
}

export function encodeSseCommentLine(comment: string): Uint8Array {
  return new TextEncoder().encode(`: ${comment}\n\n`);
}

import { validateEducationalResponse } from '../../graph/nodes/guards/educational-integrity';

/** Trailing hold-back window — must be >= longest banned leak pattern length. */
export const LIVE_STREAM_GUARD_CHARS = 80;

export type LiveStreamPushResult = {
  emit: string;
  blocked: boolean;
};

/**
 * Buffers live stream tokens and only releases a safe prefix so assessment
 * answer leaks spanning token boundaries are never emitted before a replace.
 */
export class LiveStreamGuard {
  private buffer = '';
  private emittedLength = 0;
  private blocked = false;

  push(token: string): LiveStreamPushResult {
    if (this.blocked) {
      return { emit: '', blocked: true };
    }

    this.buffer += token;
    const integrity = validateEducationalResponse(this.buffer);
    if (!integrity.isValid) {
      this.blocked = true;
      return { emit: '', blocked: true };
    }

    const safeEnd = Math.max(0, this.buffer.length - LIVE_STREAM_GUARD_CHARS);
    const safePrefix = this.buffer.slice(0, safeEnd);
    const emit = safePrefix.slice(this.emittedLength);
    this.emittedLength = safePrefix.length;

    return { emit, blocked: false };
  }

  /** Releases the withheld tail when the stream completed without a block. */
  flush(): string {
    if (this.blocked) {
      return '';
    }

    const tail = this.buffer.slice(this.emittedLength);
    this.emittedLength = this.buffer.length;
    return tail;
  }

  isBlocked(): boolean {
    return this.blocked;
  }
}

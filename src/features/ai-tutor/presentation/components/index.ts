/**
 * AI Tutor UI components
 *
 * Implemented:
 * - AITutorChat — main chat (sidebar + full variants, Chatscope layout)
 * - TutorMessageContent — markdown-lite message body
 *
 * Planned (Phase 3):
 * - ThreadSelector, ConversationHeader, MessageCard, SourceCitation
 */

export { AITutorChat } from './ai-tutor-chat';
export type { AITutorChatProps } from './ai-tutor-chat';
export { TutorMessageContent } from './tutor-message-content';
export { TutorIndexingStatusBanner } from './tutor-indexing-status-banner';
export type {
  TutorIndexingStatus,
  TutorIndexingStatusBannerProps,
} from './tutor-indexing-status-banner';

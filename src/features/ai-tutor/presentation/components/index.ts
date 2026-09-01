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

export { AITutorChat } from './AITutorChat';
export type { AITutorChatProps } from './AITutorChat';
export { TutorMessageContent } from './TutorMessageContent';
export { TutorIndexingStatusBanner } from './TutorIndexingStatusBanner';
export type {
  TutorIndexingStatus,
  TutorIndexingStatusBannerProps,
} from './TutorIndexingStatusBanner';

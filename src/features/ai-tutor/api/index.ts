/**
 * AI Tutor API handlers
 *
 * Routes (Next.js app router):
 * - POST /api/tutor/messages — ask question, SSE stream
 * - GET /api/tutor/threads — read lecture thread history (no create)
 * - GET /api/tutor/threads/:id — thread by ID
 * - GET /api/tutor/conversations — list conversations
 * - DELETE /api/tutor/conversations — delete course conversation (retention)
 * - DELETE /api/tutor/messages/:id — delete message
 * - POST /api/tutor/index — full course re-index (instructor/admin)
 */

export { handleAskTutorRequest } from './handlers/ask-tutor.handler';
export { handleGetTutorThreadRequest } from './handlers/get-tutor-thread.handler';
export { handleGetTutorThreadByIdRequest } from './handlers/get-tutor-thread-by-id.handler';
export { handleIndexCourseRequest } from './handlers/index-course.handler';
export {
  handleDeleteTutorConversationsRequest,
  handleListTutorConversationsRequest,
} from './handlers/tutor-conversations.handler';
export { handleDeleteTutorMessageRequest } from './handlers/delete-tutor-message.handler';

/**
 * AI Tutor API handlers
 *
 * Implemented routes (Next.js app router):
 * - POST /api/tutor/messages — ask question, SSE stream
 * - GET /api/tutor/threads — get-or-create lecture thread + history
 * - POST /api/tutor/index — full course re-index (instructor/admin)
 *
 * Planned:
 * - GET /api/tutor/conversations — list conversations
 * - GET /api/tutor/threads/:id — thread by ID
 * - DELETE /api/tutor/messages/:id — delete message
 */

export { handleAskTutorRequest } from './handlers/ask-tutor.handler';
export { handleGetTutorThreadRequest } from './handlers/get-tutor-thread.handler';
export { handleIndexCourseRequest } from './handlers/index-course.handler';

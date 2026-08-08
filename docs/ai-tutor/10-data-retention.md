# AI Tutor Data Retention

## Policy

- Tutor conversations are stored per student and per course.
- Students may delete their course conversation via `DELETE /api/tutor/conversations` with `{ "courseSlug": "..." }`.
- Platform operators may define an environment-level retention TTL in future releases.

## GDPR / right to erasure

Use the conversations delete endpoint to remove:

- `tutor_conversations` row for `(courseId, userId)`
- cascading `tutor_threads` and `tutor_messages`
- associated `student_learning_profiles` row for `(userId, courseId)`
- cached session context in Redis for that user/course

## Audit

Manual reindex actions (`POST /api/tutor/index`) are logged via structured application logs with course slug and user id.

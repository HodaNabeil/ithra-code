export function filterConversationsByAccessibleCourses<
  T extends { courseId: string },
>(conversations: T[], accessibleCourseIds: Set<string>): T[] {
  return conversations.filter((conversation) =>
    accessibleCourseIds.has(conversation.courseId),
  );
}

export function isCourseAccessible(
  courseId: string,
  accessibleCourseIds: Set<string>,
): boolean {
  return accessibleCourseIds.has(courseId);
}

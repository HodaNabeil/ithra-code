/** Thrown by lecture-progress use-case; route handler maps `status` to HTTP responses. */
export class LectureProgressError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'LectureProgressError';
  }
}

export function enrollmentAccessDeniedMessage(): string {
  return 'أنت غير مسجل في هذا الكورس';
}

export function progressAlreadyCompletedMessage(): string {
  return 'تم إكمال هذه المحاضرة مسبقاً';
}

/** Thrown by lecture-detail use-case; route handler maps `status` to HTTP responses. */
export class LectureDetailError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'LectureDetailError';
  }
}

export function lectureNotFoundMessage(lectureId: string): string {
  return `المحاضرة ذات المعرف ${lectureId} غير موجودة`;
}

export function courseUnresolvedMessage(): string {
  return 'تعذر تحديد الدورة لهذه المحاضرة';
}

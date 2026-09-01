/** Thrown by lecture-creation use-case; route handler maps `status` to HTTP responses. */
export class LectureCreationError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'LectureCreationError';
  }
}

export class AdminAccessError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AdminAccessError';
  }
}

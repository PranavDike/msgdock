export class MessageValidationError extends Error {
  override name = 'MessageValidationError';
}

export class MessageNotFoundError extends Error {
  override name = 'MessageNotFoundError';

  constructor(public readonly id: string) {
    super(`Message not found: ${id}`);
  }
}

export class UnsupportedQueryError extends Error {
  override name = 'UnsupportedQueryError';
}

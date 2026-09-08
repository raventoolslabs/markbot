import { ApplicationError } from './ApplicationError';

export class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

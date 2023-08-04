import { HttpError } from 'routing-controllers';

export class UserError extends HttpError {
  constructor(statusCode: number, message?: string) {
    super(statusCode, message);
  }
}

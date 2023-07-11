import { HttpError } from 'routing-controllers';

export class ErrorMessage extends HttpError {
  constructor(statusCode: number, message?: string) {
    super(statusCode, message);
  }
}

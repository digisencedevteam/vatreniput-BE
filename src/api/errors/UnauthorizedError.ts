import { HttpError } from 'routing-controllers';

export class UnauthorizedError extends HttpError {
  constructor() {
    super(401, 'Unauthorized');
  }
}

export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
export class BadRequestError extends AppError {
  constructor(message = "Bad request") { super(message, 400); }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") { super(message, 403); }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found") { super(message, 404); }
}
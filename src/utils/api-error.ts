// ─── API Error Class ───────────────────────────────────────────────────────
// Custom error with HTTP status code for consistent error handling.

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors: Record<string, string[]> = {},
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Preserve proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ── Factory Methods ────────────────────────────────────────────────────
  static badRequest(message = 'Bad request', errors: Record<string, string[]> = {}) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, {}, false);
  }
}

export default ApiError;

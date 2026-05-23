// ─── API Response Helper ───────────────────────────────────────────────────
// Consistent response envelope across the entire API.

import { Response } from 'express';
import { ApiResponsePayload, PaginationMeta } from '../types';

export class ApiResponse {
  /**
   * Send a success response.
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a created response (201).
   */
  static created<T>(res: Response, data: T, message = 'Created'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send a no-content response (204).
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send an error response.
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string[]>
  ): Response {
    const payload: ApiResponsePayload = {
      success: false,
      message,
      ...(errors && { errors }),
    };
    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;

// ─── Validation Middleware ──────────────────────────────────────────────────
// Generic Zod validation middleware for body, query, and params.

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates `req[target]` against a Zod schema.
 *
 * @example
 * router.post('/products', validate(createProductSchema, 'body'), controller.create);
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Replace with parsed (coerced / defaulted) values
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || target;
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
        next(ApiError.badRequest('Validation failed', errors));
      } else {
        next(err);
      }
    }
  };
};

export default validate;

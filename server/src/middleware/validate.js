import { AppError } from '../utils/apiResponse.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(
        new AppError(formatted[0]?.message || 'Validation failed', 400, formatted)
      );
    }
    req.body = result.data;
    return next();
  };
}

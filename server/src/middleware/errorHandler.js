import multer from 'multer';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Each image must be smaller than 5 MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'You can upload at most 10 photos at once.';
    } else {
      message = err.message;
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = errors[0]?.message || 'Database validation error';
    details = errors;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message =
      field === 'mobile'
        ? 'An account with this mobile number already exists.'
        : `Duplicate value for ${field}.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier format.';
  }

  if (statusCode >= 500 && !env.isProduction) {
    console.error('[RoomKhoj Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

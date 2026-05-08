import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Log detailed error information
  console.error(`[Error] ${code}: ${message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    originalError: err.cause ? String(err.cause) : undefined,
  });

  // Determine if this is a database connection error
  const isDatabaseError = 
    err.message?.includes('connection') ||
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('ENOTFOUND') ||
    err.message?.includes('database') ||
    err.message?.includes('DataSource');

  // Provide more helpful error messages for common scenarios
  let userMessage = message;
  if (statusCode === 500 && isDatabaseError) {
    userMessage = 'Database connection error. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: userMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalError: err.cause ? String(err.cause) : undefined 
      }),
    },
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
import { Request, Response, NextFunction } from 'express';

interface AppError {
  code?: string;
  message: string;
}

export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', error);
  
  res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal Server Error'
    }
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
};


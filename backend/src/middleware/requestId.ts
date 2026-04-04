import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      id: string;
      correlationId?: string;
    }
  }
}

/**
 * T084 & T088: Request ID middleware for tracing and correlation
 * - Generates unique request ID for each request
 * - Supports X-Request-ID header for client-side correlation
 * - Adds request ID to response headers for tracing
 * - Logs request start with correlation ID
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if client provided a request ID, otherwise generate one
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || uuidv4();
  
  // Attach to request
  req.id = requestId;
  req.correlationId = req.headers['x-correlation-id'] as string || requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  // T084: Log request with correlation ID
  logger.info({
    message: 'Incoming request',
    method: req.method,
    url: req.url,
    requestId,
    correlationId: req.correlationId,
  });
  
  next();
};

export default requestIdMiddleware;

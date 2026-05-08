import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: any, res: any, next: NextFunction): void => {
  if (!req.id) {
    req.id = uuidv4();
  }
  res.setHeader('X-Request-ID', req.id);
  next();
};


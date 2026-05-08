import { Request, Response, NextFunction } from 'express';

/**
 * Basic input sanitization middleware.
 * Strips HTML tags and trims whitespace from string fields in body and query.
 * Uses only built-in Node.js string operations – no external HTML parser needed
 * for a pure-API (non-browser) service.
 */
function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')   // Remove HTML tags
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = sanitizeString(val);
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      sanitizeObject(val as Record<string, unknown>);
    }
  }
}

export const sanitizationMiddleware = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body as Record<string, unknown>);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query as Record<string, unknown>);
    }
    next();
  };
};

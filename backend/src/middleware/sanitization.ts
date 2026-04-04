import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// T087: Add input sanitization middleware to prevent XSS

// Patterns to detect potential XSS attacks
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc.
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

// SQL injection patterns - Simplified to avoid false positives
// TypeORM uses parameterized queries which prevent SQL injection
// These patterns catch only obvious malicious patterns, not legitimate text
const SQL_INJECTION_PATTERNS = [
  /\bunion\s+select\b/gi,
  /\bexec\s*\(\s*@/gi,
  /\bexecute\s*\(\s*@/gi,
  /\bdrop\s+table\b/gi,
  /\bdrop\s+database\b/gi,
  /\binsert\s+into\b.+\bvalues\s*\(/gi,
  /\bdelete\s+from\b/gi,
  /\bupdate\b.+\bset\b.+\bwhere\b/gi,
  /--\s*$/gm,
  /\/\*!\d+/g,
];

/**
 * Sanitize a string value
 */
function sanitizeString(value: string): string {
  return value
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Check if value contains potential XSS
 */
function containsXss(value: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Check if value contains potential SQL injection
 */
function containsSqlInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Input sanitization middleware
 */
export const sanitizationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check for XSS in URL parameters
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string' && containsXss(value)) {
          logger.warn('Potential XSS attempt detected in URL params', {
            path: req.path,
            param: key,
            value,
            ip: req.ip,
          });
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid characters detected in request',
            },
          });
          return;
        }
      }

      // Check for XSS in query parameters
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          if (containsXss(value)) {
            logger.warn('Potential XSS attempt detected in query params', {
              path: req.path,
              param: key,
              value,
              ip: req.ip,
            });
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid characters detected in request',
              },
            });
            return;
          }
        }
      }

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        // Check for SQL injection in string values before sanitizing
        const checkForSqlInjection = (obj: any, path: string = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string') {
              if (containsSqlInjection(value)) {
                logger.warn('Potential SQL injection attempt detected', {
                  path: req.path,
                  field: currentPath,
                  value: value.slice(0, 100), // Truncate for logging
                  ip: req.ip,
                });
                throw new Error(`Potential SQL injection detected in field: ${currentPath}`);
              }
            } else if (typeof value === 'object' && value !== null) {
              checkForSqlInjection(value, currentPath);
            }
          }
        };

        try {
          checkForSqlInjection(req.body);
        } catch (err) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid input detected',
            },
          });
          return;
        }

        // Sanitize the body
        req.body = sanitizeObject(req.body);
      }

      next();
    } catch (error) {
      logger.error('Sanitization error', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };
};

export default sanitizationMiddleware;

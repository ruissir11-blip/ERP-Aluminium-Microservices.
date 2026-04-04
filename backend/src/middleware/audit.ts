import { Request, Response, NextFunction } from 'express';
import auditService from '../services/audit.service';
import logger from '../config/logger';

// T075: Create audit logging middleware

// Modules mapping based on route paths
const MODULE_MAPPING: Record<string, string> = {
  '/auth': 'auth',
  '/users': 'users',
  '/profiles': 'aluminium',
  '/quotes': 'aluminium',
  '/customers': 'aluminium',
  '/orders': 'aluminium',
  '/stock': 'stock',
  '/audit-logs': 'audit',
};

/**
 * Determine module from request path
 */
function getModuleFromPath(path: string): string {
  for (const [route, module] of Object.entries(MODULE_MAPPING)) {
    if (path.includes(route)) {
      return module;
    }
  }
  return 'general';
}

/**
 * Determine action type from request method and path
 */
function getActionFromRequest(method: string, path: string): string {
  const resource = path.split('/').pop() || 'unknown';
  
  switch (method) {
    case 'POST':
      return `${resource.toUpperCase()}_CREATED`;
    case 'PUT':
    case 'PATCH':
      return `${resource.toUpperCase()}_UPDATED`;
    case 'DELETE':
      return `${resource.toUpperCase()}_DELETED`;
    case 'GET':
      return `${resource.toUpperCase()}_VIEWED`;
    default:
      return `${resource.toUpperCase()}_${method}`;
  }
}

/**
 * Determine severity based on action type
 */
function getSeverity(method: string, statusCode: number): 'info' | 'warning' | 'error' {
  if (statusCode >= 500) {
    return 'error';
  }
  if (statusCode >= 400) {
    return 'warning';
  }
  if (method === 'DELETE') {
    return 'warning';
  }
  return 'info';
}

/**
 * Audit middleware - logs all requests
 */
export const auditMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to capture response status
    res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
      // Restore original end
      res.end = originalEnd;
      
      // Only log critical actions (non-GET) or all if configured
      const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || process.env.AUDIT_ALL_REQUESTS === 'true';
      
      if (shouldLog) {
        const userId = (req as any).user?.id || null;
        const module = getModuleFromPath(req.path);
        const action = getActionFromRequest(req.method, req.path);
        const severity = getSeverity(req.method, res.statusCode);
        
        // Capture request details (excluding sensitive data)
        const details: Record<string, any> = {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          query: req.query,
        };
        
        // Include body for non-GET requests (sanitized)
        if (req.body && typeof req.body === 'object') {
          const sanitizedBody = { ...req.body };
          // Remove sensitive fields
          delete sanitizedBody.password;
          delete sanitizedBody.passwordHash;
          delete sanitizedBody.token;
          delete sanitizedBody.refreshToken;
          delete sanitizedBody.mfaSecret;
          delete sanitizedBody.backupCodes;
          
          details.body = sanitizedBody;
        }
        
        // Log asynchronously (don't block response)
        auditService
          .createAuditLog(
            userId,
            action,
            module,
            details,
            req.ip,
            req.headers['user-agent'] as string,
            severity
          )
          .catch((err) => {
            logger.error('Failed to create audit log', { error: err.message });
          });
      }
      
      // Call original end
      return originalEnd.call(res, chunk, encoding, cb);
    };
    
    next();
  };
};

/**
 * Manual audit log helper for specific actions
 */
export const logAuditEvent = async (
  req: Request,
  action: string,
  module: string,
  details: Record<string, any>,
  severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> => {
  const userId = (req as any).user?.id || null;
  
  await auditService.createAuditLog(
    userId,
    action,
    module,
    details,
    req.ip,
    req.headers['user-agent'] as string,
    severity
  );
};

export default auditMiddleware;

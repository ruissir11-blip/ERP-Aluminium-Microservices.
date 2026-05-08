import { Request, Response, NextFunction } from 'express';

export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    // Fallback: if user is admin, allow everything
    if (user && (user.role === 'admin' || user.role === 'ADMIN' || user.role === 'RH_MANAGER')) {
      return next();
    }

    if (!user || !user.permissions || !user.permissions[resource] || !user.permissions[resource][action]) {
      res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: `Insufficient permissions for ${resource}:${action}` } 
      });
      return;
    }
    next();
  };
};


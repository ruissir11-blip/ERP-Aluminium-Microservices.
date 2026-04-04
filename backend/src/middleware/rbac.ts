import { Request, Response, NextFunction } from 'express';

export interface Permission {
  module: string;
  actions: string[];
}

export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const permissions: Permission[] = user.role?.permissions || [];
    
    // Allow access to users with admin role or users permission for all modules
    const hasAdminRole = user.role?.name === 'admin';
    const hasFullAccess = permissions.some(
      (p: Permission) => p.module === '*' && p.actions.includes('*')
    );
    
    if (hasAdminRole || hasFullAccess) {
      next();
      return;
    }
    
    const hasPermission = permissions.some(
      (p: Permission) =>
        (p.module === module || p.module === '*') &&
        (p.actions.includes(action) || p.actions.includes('*'))
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action',
        },
      });
      return;
    }

    next();
  };
};

// Helper middleware for common permission checks
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user || user.role?.name !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required',
      },
    });
    return;
  }

  next();
};
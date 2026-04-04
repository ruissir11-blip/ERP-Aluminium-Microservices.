/**
 * Role-Based Access Control (RBAC) Types for AluTech ERP
 */

// Define all available roles in the system
export type UserRole = 
  | 'ADMIN'
  | 'RH_RESPONSIBLE'
  | 'COMMERCIAL_RESPONSIBLE'
  | 'COMPTABLE'
  | 'STOCK_RESPONSIBLE'
  | 'MAINTENANCE_RESPONSIBLE';

// Role hierarchy for comparing roles (higher index = more permissions)
export const ROLE_HIERARCHY: UserRole[] = [
  'MAINTENANCE_RESPONSIBLE',
  'STOCK_RESPONSIBLE',
  'COMPTABLE',
  'COMMERCIAL_RESPONSIBLE',
  'RH_RESPONSIBLE',
  'ADMIN',
];

// Check if user has required role or higher (ADMIN can access everything)
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  // ADMIN has access to everything
  if (userRole === 'ADMIN') return true;
  
  return userRoleIndex >= requiredRoleIndex;
}

// Check if user has any of the allowed roles
export function hasAnyRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  
  // ADMIN has access to everything
  if (userRole === 'ADMIN') return true;
  
  return allowedRoles.includes(userRole);
}

// Get role display name in French
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrateur',
    RH_RESPONSIBLE: 'Responsable RH',
    COMMERCIAL_RESPONSIBLE: 'Responsable Commercial',
    COMPTABLE: 'Comptable',
    STOCK_RESPONSIBLE: 'Responsable Stock',
    MAINTENANCE_RESPONSIBLE: 'Responsable Maintenance',
  };
  return roleNames[role] || role;
}

// Get user's default redirect path based on role
export function getDefaultRouteForRole(role: UserRole | undefined): string {
  if (!role) return '/login';
  
  const roleRoutes: Record<UserRole, string> = {
    ADMIN: '/',
    RH_RESPONSIBLE: '/hr',
    COMMERCIAL_RESPONSIBLE: '/customers',
    COMPTABLE: '/comptabilite/financial-dashboard',
    STOCK_RESPONSIBLE: '/stock',
    MAINTENANCE_RESPONSIBLE: '/maintenance',
  };
  
  return roleRoutes[role] || '/';
}
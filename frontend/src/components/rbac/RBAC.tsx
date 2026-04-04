import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { UserRole, hasAnyRole, getDefaultRouteForRole } from '../../types/rbac';

// ============================================================================
// RoleWrapper - Component-level access control
// Use this to wrap individual components or buttons that should only be visible
// to users with specific roles.
// ============================================================================

interface RoleWrapperProps {
  /** The roles that are allowed to see this component */
  allowedRoles: UserRole[];
  /** Child components to render if user has permission */
  children: React.ReactNode;
  /** Optional: Fallback component to show if user doesn't have permission */
  fallback?: React.ReactNode;
  /** Optional: Whether to hide the component (true) or show fallback (false) */
  hideOnUnauthorized?: boolean;
}

export const RoleWrapper: React.FC<RoleWrapperProps> = ({
  allowedRoles,
  children,
  fallback = null,
  hideOnUnauthorized = true,
}) => {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  if (!hasAnyRole(userRole, allowedRoles)) {
    return hideOnUnauthorized ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// RoleProtectedRoute - Route-level access control
// Use this to protect entire routes/pages based on user roles.
// ============================================================================

interface RoleProtectedRouteProps {
  /** The roles that are allowed to access this route */
  allowedRoles: UserRole[];
  /** The component to render if user has permission */
  children: React.ReactNode;
  /** Optional: Redirect to custom path on unauthorized access */
  redirectTo?: string;
  /** Optional: Show Access Denied page instead of redirect */
  showAccessDenied?: boolean;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
  redirectTo,
  showAccessDenied = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const userRole = user?.role as UserRole | undefined;

  // Still loading - show nothing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User doesn't have the required role
  if (!hasAnyRole(userRole, allowedRoles)) {
    // Option 1: Show Access Denied page
    if (showAccessDenied) {
      return <AccessDeniedPage />;
    }

    // Option 2: Redirect to user's default home page
    const redirectPath = redirectTo || getDefaultRouteForRole(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  // User has permission - render the children
  return <>{children}</>;
};

// ============================================================================
// AccessDeniedPage - Shown when user tries to access unauthorized route
// ============================================================================

const AccessDeniedPage: React.FC = () => {
  const { user } = useAuth();
  const redirectPath = getDefaultRouteForRole(user?.role as UserRole | undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas l'autorisation d'accéder à cette page.
        </p>
        <a
          href={redirectPath}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retour à la page d'accueil
        </a>
      </div>
    </div>
  );
};

export default RoleWrapper;
/**
 * Protected route — redirects to login if not authenticated.
 * Optionally checks role.
 */
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'patient' | 'doctor' | 'admin' | 'lab';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to the correct dashboard based on their role
    if (user?.role === 'patient') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'doctor') return <Navigate to="/doctor" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'lab') return <Navigate to="/lab" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

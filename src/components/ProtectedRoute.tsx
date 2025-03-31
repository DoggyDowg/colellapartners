import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if the auth state is determined and user is not logged in
    if (!loading && !user) {
      // Store the current location to redirect back after login
      const currentPath = window.location.pathname;
      navigate({ 
        to: redirectTo, 
        search: { redirect: currentPath !== redirectTo ? currentPath : undefined } 
      });
    }
  }, [user, loading, navigate, redirectTo]);

  // Show loading state or null while checking auth
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
} 
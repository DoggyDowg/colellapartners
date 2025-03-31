import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';

export function useRedirectAfterAuth(redirectTo: string = '/') {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after auth state is determined and user is logged in
    if (!loading && user) {
      navigate({ to: redirectTo });
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
} 
import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import supabase from '../../lib/supabase';

interface CallbackSearchParams {
  redirect?: string;
}

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
  validateSearch: (search: Record<string, unknown>): CallbackSearchParams => {
    return { 
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined 
    };
  },
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth/callback' }) as CallbackSearchParams;
  const redirectPath = search.redirect || '/';
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get and handle the auth callback from Supabase
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Redirect to the intended destination
        navigate({ to: redirectPath });
      } catch (err: any) {
        console.error('Error during auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
        // Redirect to login on error
        setTimeout(() => {
          navigate({ to: '/auth/login' });
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [navigate, redirectPath]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {error ? (
        <div className="rounded bg-destructive p-4 text-destructive-foreground">
          <h2 className="text-xl font-bold">Authentication Error</h2>
          <p>{error}</p>
          <p className="mt-2">Redirecting to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold">Authenticating...</div>
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
} 
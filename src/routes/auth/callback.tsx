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
  // If a specific redirect path is provided, use it
  // Otherwise, we'll determine based on the user's role
  const redirectParam = search.redirect;
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Let Supabase handle the session
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if the user needs to complete onboarding
        try {
          // Get the user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('name, phone_number, birthday')
            .eq('id', session.user.id)
            .single();
          
          // If no profile exists or missing required fields, redirect to onboarding
          if (profileError || !profile || !profile.name || !profile.phone_number || !profile.birthday) {
            navigate({ to: '/onboarding' });
            return;
          }
          
          // If a specific redirect is provided in the URL, use that instead
          if (redirectParam && redirectParam !== '/') {
            navigate({ to: redirectParam });
            return;
          }
          
          // Check if the user is an admin
          const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
          
          if (adminError) {
            // Set error state instead of console.error
            setError(`Admin check failed: ${adminError.message}`);
            // Default to partner dashboard if we can't determine admin status
            navigate({ to: '/' });
            return;
          }
          
          // Redirect based on user role
          if (isAdmin) {
            navigate({ to: '/admin' });
          } else {
            navigate({ to: '/' });
          }
        } catch (_error) {
          // Set error state instead of console.error
          setError('Error during role check');
          // Default to partner dashboard on error
          navigate({ to: '/' });
        }
      }
    });
    
    // Check if we already have a session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          // Check if the user needs to complete onboarding
          try {
            // Get the user profile
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('name, phone_number, birthday')
              .eq('id', data.session.user.id)
              .single();
            
            // If no profile exists or missing required fields, redirect to onboarding
            if (profileError || !profile || !profile.name || !profile.phone_number || !profile.birthday) {
              navigate({ to: '/onboarding' });
              return;
            }
            
            // If a specific redirect is provided in the URL, use that instead
            if (redirectParam && redirectParam !== '/') {
              navigate({ to: redirectParam });
              return;
            }
            
            // Check if the user is an admin
            const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
            
            if (adminError) {
              // Set error state instead of console.error
              setError(`Admin check failed: ${adminError.message}`);
              // Default to partner dashboard if we can't determine admin status
              navigate({ to: '/' });
              return;
            }
            
            // Redirect based on user role
            if (isAdmin) {
              navigate({ to: '/admin' });
            } else {
              navigate({ to: '/' });
            }
          } catch (_error) {
            // Set error state instead of console.error
            setError('Error during role check');
            // Default to partner dashboard on error
            navigate({ to: '/' });
          }
        } else {
          // If no session after 3 seconds, navigate to auth
          setTimeout(() => {
            navigate({ to: '/auth' });
          }, 3000);
        }
      } catch (err: unknown) {
        // Set error state instead of console.error
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication';
        setError(errorMessage);
        setTimeout(() => {
          navigate({ to: '/auth' });
        }, 3000);
      }
    };
    
    checkSession();
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate, redirectParam]);
  
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
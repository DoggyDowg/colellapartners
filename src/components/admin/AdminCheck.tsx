import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import supabase from '@/lib/supabase';

// Utility function for error handling
const logError = (_message: string, _error: unknown): void => {
  // In a production app, you might want to use a proper logging service
  // const errorMessage = _error instanceof Error ? _error.message : String(_error);
  // We're not using alert here because this is a silent component
};

// Utility function for informational logging
const logInfo = (_message: string): void => {
  // In a production app, you might want to use a proper logging service
};

export function AdminCheck() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          logInfo('No session found, redirecting to login');
          navigate({ to: '/auth' });
          return;
        }
        
        // Check if user is admin
        const { data: isAdmin, error } = await supabase.rpc('is_admin');
        
        if (error) {
          logError('Error checking admin status:', error);
          navigate({ to: '/' });
          return;
        }
        
        if (!isAdmin) {
          logInfo('User is not an admin, redirecting to dashboard');
          navigate({ to: '/' });
          return;
        }
        
        // User is authenticated and is an admin
        setChecking(false);
      } catch (error) {
        logError('Error in AdminCheck:', error);
        navigate({ to: '/' });
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Return null while checking to prevent flash of content
  if (checking) {
    return null;
  }
  
  // If we reach here, the user is an admin
  return null;
} 
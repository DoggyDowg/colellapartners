import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import supabase from '@/lib/supabase';

export function AdminCheck() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to login');
          navigate({ to: '/auth/login' });
          return;
        }
        
        // Check if user is admin
        const { data: isAdmin, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          navigate({ to: '/' });
          return;
        }
        
        if (!isAdmin) {
          console.log('User is not an admin, redirecting to dashboard');
          navigate({ to: '/' });
          return;
        }
        
        // User is authenticated and is an admin
        setChecking(false);
      } catch (error) {
        console.error('Error in AdminCheck:', error);
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
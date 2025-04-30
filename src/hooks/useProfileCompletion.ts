import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { useAuth } from './useAuth';

const PROFILE_DIALOG_SHOWN_KEY = 'profile_dialog_shown';

export function useProfileCompletion() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkProfileStatus() {
      if (!isMounted) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('name, phone_number, birthday')
          .eq('id', user?.id ?? '')
          .single();

        if (!isMounted) return;

        // Mark profile as incomplete if any of the required fields are missing
        const incomplete = profileError || !profile || !profile.name || !profile.phone_number || !profile.birthday;
        
        setIsProfileComplete(!incomplete);
        
        // Only show the dialog if:
        // 1. The profile is incomplete
        // 2. We haven't shown it already this session
        const alreadyShownThisSession = sessionStorage.getItem(PROFILE_DIALOG_SHOWN_KEY) === 'true';
        
        if (incomplete && !alreadyShownThisSession) {
          setIsDialogOpen(true);
          // Mark that we've shown the dialog this session
          sessionStorage.setItem(PROFILE_DIALOG_SHOWN_KEY, 'true');
        }
      } catch (_error) {
        // No need to show error to user here, just capture it silently
        // The profile will be treated as incomplete which is the safe default
        if (isMounted) {
          setIsProfileComplete(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    checkProfileStatus();

    return () => {
      isMounted = false;
    };
  }, [user]); // Remove isLoading from dependencies

  const openDialog = () => {
    setIsDialogOpen(true);
    // Mark that we've shown the dialog this session
    sessionStorage.setItem(PROFILE_DIALOG_SHOWN_KEY, 'true');
  };
  
  const closeDialog = () => setIsDialogOpen(false);

  const handleProfileCompleted = async () => {
    setIsProfileComplete(true);
  };

  return {
    isProfileComplete,
    isLoading,
    isDialogOpen,
    openDialog,
    closeDialog,
    handleProfileCompleted,
  };
} 
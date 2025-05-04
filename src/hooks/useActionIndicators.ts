import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useProfileCompletion } from './useProfileCompletion';

export interface ActionIndicators {
  // Profile indicators
  profileIncomplete: boolean;
  
  // Communication preferences
  communicationPreferencesMissing: boolean;
  
  // Combined indicator for Settings section
  hasSettingsActions: boolean;
}

export function useActionIndicators() {
  const { user } = useAuth();
  const { isProfileComplete } = useProfileCompletion();
  // Restore state
  const [communicationPreferencesMissing, setCommunicationPreferencesMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Restore the function definition and fix it
    async function checkCommunicationPreferences() {
      try {
        // Check if the user has set communication preferences
        const { data, error } = await supabase
          .from('user_profiles') // Query the correct table
          .select('communication_emails, marketing_emails') // Select existing columns
          .eq('id', user?.id ?? '') // Use 'id' as the column for user ID in profiles
          .single();

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
          // Consider logging the error if needed, but treat as missing for the indicator
          setCommunicationPreferencesMissing(true);
        } else if (!data) {
            // If no profile row exists, preferences are missing
            setCommunicationPreferencesMissing(true);
        } else {
          // Check if either preference is null/undefined (not explicitly set)
          // Note: Supabase booleans are typically true/false, null indicates not set.
          const commEmailNotSet = data.communication_emails === null || data.communication_emails === undefined;
          const marketingEmailNotSet = data.marketing_emails === null || data.marketing_emails === undefined;
          
          // Preferences are missing if either email setting hasn't been explicitly chosen
          setCommunicationPreferencesMissing(commEmailNotSet || marketingEmailNotSet);
        }
      } catch (_error) {
        // Default to showing the indicator if there's an error during fetch
        if (isMounted) {
          setCommunicationPreferencesMissing(true);
        }
      } finally {
        // Restore loading state update
        if (isMounted) {
          setIsLoading(false); 
        }
      }
    }

    // Restore the call to the function
    setIsLoading(true);
    checkCommunicationPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Restore the combined indicator
  const hasSettingsActions = !isProfileComplete || communicationPreferencesMissing;

  return {
    isLoading,
    profileIncomplete: !isProfileComplete,
    communicationPreferencesMissing, 
    hasSettingsActions,
  };
} 
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
  const [communicationPreferencesMissing, setCommunicationPreferencesMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkCommunicationPreferences() {
      try {
        // Check if the user has set communication preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .select('communication_email_opt_in, communication_sms_opt_in')
          .eq('user_id', user?.id ?? '')
          .single();

        if (!isMounted) return;

        if (error || !data) {
          // If no preferences found, they need to be set
          setCommunicationPreferencesMissing(true);
        } else {
          // Check if either preference is null/undefined (not explicitly set)
          const emailNotSet = data.communication_email_opt_in === null || data.communication_email_opt_in === undefined;
          const smsNotSet = data.communication_sms_opt_in === null || data.communication_sms_opt_in === undefined;
          
          setCommunicationPreferencesMissing(emailNotSet || smsNotSet);
        }
      } catch (_error) {
        // Default to showing the indicator if there's an error
        if (isMounted) {
          setCommunicationPreferencesMissing(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    checkCommunicationPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combined indicator for the Settings section - true if any setting needs attention
  const hasSettingsActions = !isProfileComplete || communicationPreferencesMissing;

  return {
    profileIncomplete: !isProfileComplete,
    communicationPreferencesMissing,
    hasSettingsActions,
    isLoading,
  };
} 
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  theme: string | null
  dob: string | null
}

export function useUserProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (error) {
        setError(error)
        return
      }
      
      setProfile(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  // Set up real-time subscription for profile changes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as UserProfile)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
  
  // Get profile picture URL with fallback logic
  const getProfilePicture = () => {
    // First priority: profile avatar_url from database
    if (profile?.avatar_url) {
      return profile.avatar_url
    }
    
    // Second priority: user metadata avatar_url from auth
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    
    // Last resort: default fallback avatar
    return '/avatars/01.png'
  }
  
  return {
    profile,
    loading,
    error,
    getProfilePicture,
    refreshProfile: loadUserProfile
  }
} 
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
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

  useEffect(() => {
    async function loadUserProfile() {
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
          console.error('Error fetching user profile:', error)
          setError(error)
          return
        }
        
        setProfile(data)
      } catch (err) {
        console.error('Exception fetching user profile:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }
    
    loadUserProfile()
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
    getProfilePicture
  }
} 
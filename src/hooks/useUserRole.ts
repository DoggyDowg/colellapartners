import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import supabase from '@/lib/supabase'

interface UserRole {
  role: string
  role_id: string
  created_at: string
  updated_at: string
}

export function useUserRole() {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setUserRole(null)
      return
    }

    let isMounted = true

    async function fetchUserRole() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('user_roles')
          .select('role, role_id, created_at, updated_at')
          .eq('user_id', user!.id)
          .single()

        if (!isMounted) return

        if (error) {
          if (error.code === 'PGRST116') {
            // No role found - this is expected for new users
            setUserRole(null)
          } else {
            throw error
          }
        } else {
          setUserRole(data)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to fetch user role')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserRole()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const isPartner = userRole?.role === 'partner'
  const isManager = userRole?.role === 'manager'
  const isAdmin = userRole?.role === 'admin'
  const isUser = userRole?.role === 'user'

  const updateUserRole = async (_newRole: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase.rpc('update_user_to_partner_role', {
      user_uuid: user.id
    })

    if (error) {
      throw error
    }

    // Refresh the role data
    const { data: updatedData, error: fetchError } = await supabase
      .from('user_roles')
      .select('role, role_id, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    setUserRole(updatedData)
  }

  return {
    userRole,
    loading,
    error,
    isPartner,
    isManager,
    isAdmin,
    isUser,
    updateUserRole
  }
} 
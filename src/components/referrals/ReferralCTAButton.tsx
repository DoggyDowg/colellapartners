'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import supabase from '@/lib/supabase'
import { PartnerReferralForm } from './PartnerReferralForm'
import { AdminReferralForm } from './AdminReferralForm'

export function ReferralCTAButton() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!user) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const { data, error } = await supabase.rpc('is_admin')
        
        if (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(!!data)
        }
      } catch (error) {
        console.error('Error in admin check:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  if (loading) {
    return null // Don't render anything while checking
  }

  if (isAdmin) {
    // Admin version - use the AdminReferralForm
    return <AdminReferralForm />
  }

  // Partner version - use the partner referral form
  return <PartnerReferralForm />
} 
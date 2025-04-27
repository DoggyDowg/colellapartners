'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import supabase from '@/lib/supabase'
import { PartnerReferralForm } from './PartnerReferralForm'
import { AdminReferralForm } from './AdminReferralForm'
import { handleError } from '@/utils/error-handler'

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
          handleError(error, {
            context: 'ReferralCTAButton.checkAdminStatus',
            toastMessage: 'Error checking admin status',
            showToast: false
          })
          setIsAdmin(false)
        } else {
          setIsAdmin(!!data)
        }
      } catch (error: unknown) {
        handleError(error, {
          context: 'ReferralCTAButton.checkAdminStatus',
          toastMessage: 'Error in admin check',
          showToast: false
        })
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
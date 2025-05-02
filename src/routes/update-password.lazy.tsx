import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { UpdatePasswordForm } from '@/features/auth/update-password/components/update-password-form'
import { toast } from '@/hooks/use-toast'
import AuthLayout from '@/features/auth/auth-layout'

// This route handles the page the user lands on after clicking the password reset link.
export const Route = createLazyFileRoute('/update-password')({
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)

  // This handles both direct session checks and recovery via URL
  useEffect(() => {
    let isMounted = true

    const processRecoveryLink = async () => {
      try {
        // Try to get the active session first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Already have a session
          if (isMounted) {
            setIsValidSession(true)
            setLoading(false)
          }
          return
        }
        
        // No session - check for recovery flow
        // When the user clicks a password reset link, Supabase adds a #access_token=... hash to the URL
        // We need to let Supabase process this hash to establish the recovery session
        
        // Important: Supabase detects the hash automatically when the SDK is initialized
        // We just need to give it a moment to process
        
        // Try once more after a short delay
        setTimeout(async () => {
          if (!isMounted) return
          
          const { data: { session: recoveredSession } } = await supabase.auth.getSession()
          
          if (recoveredSession) {
            setIsValidSession(true)
          } else {
            // As a last resort, try to manually parse the token from URL
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
              try {
                const params = new URLSearchParams(hash.substring(1))
                const accessToken = params.get('access_token')
                
                if (accessToken) {
                  // Try setting the session manually
                  const { data } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: '',
                  })
                  
                  if (data.session) {
                    setIsValidSession(true)
                  } else {
                    setIsValidSession(false)
                  }
                }
              } catch (_error) {
                setIsValidSession(false)
              }
            } else {
              setIsValidSession(false)
            }
          }
          
          setLoading(false)
        }, 500) // Short delay to let Supabase process the hash
      } catch (_error) {
        if (isMounted) {
          setIsValidSession(false)
          setLoading(false)
        }
      }
    }
    
    processRecoveryLink()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Effect to handle redirection
  useEffect(() => {
    if (!loading && !isValidSession) {
      toast({ 
        title: 'Invalid Password Reset Link', 
        description: 'The password reset link is invalid, expired, or has already been used. Please request a new one.', 
        variant: 'destructive' 
      })
      navigate({ to: '/auth/login', replace: true })
    }
  }, [loading, isValidSession, navigate])

  // --- Render Logic --- 
  if (loading) {
    return <AuthLayout><div className="p-4 text-center">Verifying reset link...</div></AuthLayout>
  }

  if (!isValidSession) {
    return <AuthLayout><div className="p-4 text-destructive text-center">Invalid session. Redirecting...</div></AuthLayout>
  }

  return (
    <AuthLayout>
      <div className="mb-4 text-center"> 
        <h1 className="text-2xl font-semibold tracking-tight">Update Your Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter and confirm your new password below.
        </p>
      </div>
      <UpdatePasswordForm />
    </AuthLayout>
  )
} 
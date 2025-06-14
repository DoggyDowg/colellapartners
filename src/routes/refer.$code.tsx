import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Loader2, User, Building2, Phone, Mail, ExternalLink } from 'lucide-react'
// import { toast } from 'sonner' // TODO: Add toast notifications if needed
import supabase from '../lib/supabase'

// interface Partner {
//   id: string
//   full_name: string
//   email: string
//   phone?: string
//   business_name?: string
//   contact_person?: string
//   is_business: boolean
//   partner_code: string
//   active: boolean
// }

export const Route = createFileRoute('/refer/$code')({
  component: ReferralRedirect,
  loader: async ({ params }) => {
    const { code } = params
    
    // Validate the code format
    if (!code || code.length < 3 || code.length > 6) {
      throw redirect({
        to: '/referral',
        search: { error: 'invalid-code', partner: undefined }
      })
    }

    // Look up the partner by code
    try {
      const { data: partner, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('partner_code', code.toUpperCase())
        .eq('active', true)
        .single()

      if (error || !partner) {
        throw redirect({
          to: '/referral',
          search: { error: 'code-not-found', partner: undefined }
        })
      }

      // Store partner assignment in session storage for form pre-filling
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('referral_partner_id', partner.id)
        sessionStorage.setItem('referral_partner_code', code.toUpperCase())
        sessionStorage.setItem('referral_partner_name', partner.business_name || partner.full_name)
      }

      return { partner, code: code.toUpperCase() }
    } catch (error) {
      console.error('Partner lookup error:', error)
      throw redirect({
        to: '/referral',
        search: { error: 'lookup-failed', partner: undefined }
      })
    }
  }
})

function ReferralRedirect() {
  const { partner, code } = Route.useLoaderData()
  const [countdown, setCountdown] = useState(5)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRedirect = () => {
    setIsRedirecting(true)
    
    // Track the referral source
    trackReferralClick(partner.id, code)
    
    // Redirect to the referral form
    window.location.href = '/referral'
  }

  const trackReferralClick = async (partnerId: string, partnerCode: string) => {
    try {
      // You could add analytics tracking here
      console.log('Referral click tracked:', { partnerId, partnerCode })
      
      // Store tracking data in session for form submission
      sessionStorage.setItem('referral_source', 'partner_link')
      sessionStorage.setItem('referral_timestamp', new Date().toISOString())
    } catch (error) {
      console.error('Failed to track referral click:', error)
    }
  }

  const handleManualRedirect = () => {
    handleRedirect()
  }

  const partnerDisplayName = partner.business_name || partner.full_name
  // const contactPerson = partner.is_business && partner.contact_person 
  //   ? partner.contact_person 
  //   : partner.full_name

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {partner.is_business ? (
              <Building2 className="h-6 w-6 text-blue-600" />
            ) : (
              <User className="h-6 w-6 text-blue-600" />
            )}
            <CardTitle className="text-xl">Welcome!</CardTitle>
          </div>
          <p className="text-muted-foreground">
            You've been referred by
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Partner Information */}
          <div className="text-center space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {partnerDisplayName}
              </h2>
              {partner.is_business && partner.contact_person && (
                <p className="text-muted-foreground">
                  Contact: {partner.contact_person}
                </p>
              )}
            </div>
            
            {/* Partner Code Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Code: {code}
              </Badge>
            </div>

            {/* Contact Information */}
            {(partner.phone || partner.email) && (
              <div className="space-y-2 text-sm">
                {partner.phone && (
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{partner.phone}</span>
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{partner.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Redirect Information */}
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                <strong>You'll be redirected to the referral form</strong>
              </p>
              <p className="text-xs text-blue-600">
                Your partner information will be automatically filled in
              </p>
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && !isRedirecting && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-muted-foreground">
                  Redirecting in {countdown} seconds...
                </span>
              </div>
            )}

            {/* Manual Redirect Button */}
            <Button
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className="w-full flex items-center justify-center space-x-2"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Go to Referral Form Now</span>
                </>
              )}
            </Button>
          </div>

          {/* Benefits Section */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-gray-900">Why Refer to Colella Partners?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Expert real estate guidance</li>
              <li>• Personalized service</li>
              <li>• Proven track record</li>
              <li>• {partner.full_name} trusts us with their referrals</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
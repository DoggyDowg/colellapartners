import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Loader2, User, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '../lib/supabase'

interface ReferralFormData {
  referee_name: string
  referee_phone: string
  referee_email: string
  referee_type: 'seller' | 'landlord'
  situation_description: string
  additional_notes: string
  contact_consent: boolean
  referrer_id?: string
  property_address?: string
}

interface PartnerInfo {
  id: string
  name: string
  code: string
}

export const Route = createFileRoute('/referral')({
  component: PublicReferralForm,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: search.error as string | undefined,
      partner: search.partner as string | undefined
    }
  }
})

function PublicReferralForm() {
  const { error } = Route.useSearch()
  const [formData, setFormData] = useState<ReferralFormData>({
    referee_name: '',
    referee_phone: '',
    referee_email: '',
    referee_type: 'seller',
    situation_description: '',
    additional_notes: '',
    contact_consent: true
  })
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    // Check for partner information from session storage
    const partnerId = sessionStorage.getItem('referral_partner_id')
    const partnerCode = sessionStorage.getItem('referral_partner_code')
    const partnerName = sessionStorage.getItem('referral_partner_name')

    if (partnerId && partnerCode && partnerName) {
      setPartnerInfo({
        id: partnerId,
        code: partnerCode,
        name: partnerName
      })
      setFormData(prev => ({ ...prev, referrer_id: partnerId }))
    }
  }, [])

  const handleInputChange = (field: keyof ReferralFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSubmitError(null) // Clear error when user starts typing
  }

  const validateForm = (): string | null => {
    if (!formData.referee_name.trim()) return 'Please enter the referee\'s name'
    if (!formData.referee_phone.trim() && !formData.referee_email.trim()) {
      return 'Please provide either a phone number or email address'
    }
    if (!formData.situation_description.trim()) return 'Please describe the referral situation'
    if (!formData.contact_consent) return 'Consent to contact is required'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare the data for submission
      const submissionData = {
        ...formData,
        referee_name: formData.referee_name.trim(),
        referee_phone: formData.referee_phone.trim() || null,
        referee_email: formData.referee_email.trim() || null,
        situation_description: formData.situation_description.trim(),
        additional_notes: formData.additional_notes.trim() || null,
        status: 'New' as const
      }

      // Submit to Supabase
      const { error } = await supabase
        .from('referrals')
        .insert([submissionData])
        .select()
        .single()

      if (error) throw error

      // Clear session storage
      sessionStorage.removeItem('referral_partner_id')
      sessionStorage.removeItem('referral_partner_code') 
      sessionStorage.removeItem('referral_partner_name')
      sessionStorage.removeItem('referral_source')
      sessionStorage.removeItem('referral_timestamp')

      setIsSubmitted(true)
      toast.success('Referral submitted successfully!')

    } catch (error) {
      console.error('Referral submission error:', error)
      setSubmitError('Failed to submit referral. Please try again.')
      toast.error('Failed to submit referral')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show error states from URL params
  if (error) {
    let errorMessage = 'An error occurred'
    switch (error) {
      case 'invalid-code':
        errorMessage = 'Invalid referral code format'
        break
      case 'code-not-found':
        errorMessage = 'Referral code not found or inactive'
        break
      case 'lookup-failed':
        errorMessage = 'Failed to process referral code'
        break
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-green-600 mb-2">Referral Submitted!</h2>
                <p className="text-muted-foreground">
                  Thank you for your referral. Colella Partners will be in touch with the referred person soon.
                </p>
              </div>
              {partnerInfo && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <strong>{partnerInfo.name}</strong> will be notified of this referral.
                  </p>
                </div>
              )}
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Referral</h1>
          <p className="text-muted-foreground">
            Help someone find their dream property with Colella Partners
          </p>
        </div>

        {/* Partner Info Display */}
        {partnerInfo && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">
                    <strong>Referred by:</strong> {partnerInfo.name}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Code: {partnerInfo.code}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Referee Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Person Being Referred</h3>
                
                <div>
                  <Label htmlFor="referee_name">Full Name *</Label>
                  <Input
                    id="referee_name"
                    value={formData.referee_name}
                    onChange={(e) => handleInputChange('referee_name', e.target.value)}
                    placeholder="Enter the person's full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referee_phone">Phone Number</Label>
                    <Input
                      id="referee_phone"
                      type="tel"
                      value={formData.referee_phone}
                      onChange={(e) => handleInputChange('referee_phone', e.target.value)}
                      placeholder="(04) 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="referee_email">Email Address</Label>
                    <Input
                      id="referee_email"
                      type="email"
                      value={formData.referee_email}
                      onChange={(e) => handleInputChange('referee_email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="referee_type">Referral Type *</Label>
                  <Select
                    value={formData.referee_type}
                    onValueChange={(value) => handleInputChange('referee_type', value as 'seller' | 'landlord')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Property Seller</SelectItem>
                      <SelectItem value="landlord">Landlord/Property Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Situation Description */}
              <div>
                <Label htmlFor="situation_description">Situation Description *</Label>
                <Textarea
                  id="situation_description"
                  value={formData.situation_description}
                  onChange={(e) => handleInputChange('situation_description', e.target.value)}
                  placeholder="Please describe the person's property situation and needs..."
                  rows={4}
                  required
                />
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  placeholder="Any additional information that might be helpful..."
                  rows={3}
                />
              </div>

              {/* Consent */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="contact_consent"
                  checked={formData.contact_consent}
                  onCheckedChange={(checked) => handleInputChange('contact_consent', !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="contact_consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to Colella Partners contacting this person *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you confirm you have permission to refer this person and they may be contacted by Colella Partners.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting Referral...</span>
                  </>
                ) : (
                  <span>Submit Referral</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Questions? Contact Colella Partners at{' '}
            <a href="tel:+61234567890" className="text-blue-600 hover:underline">
              (02) 1234 5678
            </a>{' '}
            or{' '}
            <a href="mailto:info@colellapartners.com.au" className="text-blue-600 hover:underline">
              info@colellapartners.com.au
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 
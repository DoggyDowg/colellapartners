'use client'

import { toast } from '@/hooks/use-toast'
import { PartnerReferralForm } from './PartnerReferralForm'

export function PartnerReferralFormExample() {
  const handleReferralSuccess = () => {
    toast({
      title: "Partner referral submitted",
      description: "Your client referral has been successfully submitted.",
    })
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Partner Referrals</h2>
      <p className="mb-6">
        As a valued partner, you can use the form below to submit new client referrals to our team.
      </p>
      <PartnerReferralForm onSubmitSuccess={handleReferralSuccess} />
    </div>
  )
} 
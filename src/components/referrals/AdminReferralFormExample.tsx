'use client'

import { toast } from '@/hooks/use-toast'
import { AdminReferralForm } from './AdminReferralForm'

export function AdminReferralFormExample() {
  const handleReferralSuccess = () => {
    toast({
      title: "Admin referral submitted",
      description: "The referral has been successfully submitted.",
    })
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Admin Referral Creation</h2>
      <p className="mb-6">
        As an admin, you can use the form below to create new referrals on behalf of partners.
      </p>
      <AdminReferralForm onSubmitSuccess={handleReferralSuccess} />
    </div>
  )
} 
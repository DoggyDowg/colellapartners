import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AuthLayout from '../auth-layout'
import { PartnerSetupPrompt } from './components/partner-setup-prompt'
import { PartnerSetupForm } from './components/partner-setup-form'

export default function PartnerSetup() {
  const [showPrompt, setShowPrompt] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const handleNo = () => {
    // User chose not to set up partner account - redirect to dashboard
    navigate({ to: '/' })
  }

  const handleYes = () => {
    // User wants to set up partner account - show the form
    setShowPrompt(false)
    setShowForm(true)
  }

  const handleComplete = () => {
    // Partner setup completed or cancelled - redirect to dashboard
    navigate({ to: '/' })
  }

  return (
    <AuthLayout>
      <PartnerSetupPrompt 
        open={showPrompt}
        onNo={handleNo}
        onYes={handleYes}
      />
      
      <PartnerSetupForm 
        open={showForm}
        onComplete={handleComplete}
      />
    </AuthLayout>
  )
} 
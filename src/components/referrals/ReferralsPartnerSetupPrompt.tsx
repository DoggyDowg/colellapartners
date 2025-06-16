import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '../ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../../lib/utils'
import { ToolkitPartnerSetupForm } from '../../features/referral-toolkit/components/toolkit-partner-setup-form'

interface ReferralsPartnerSetupPromptProps {
  isOpen: boolean
  onClose: () => void
  onSetupComplete: () => void
}

// Custom DialogContent without close button
const DialogContentNoClose = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
)

export function ReferralsPartnerSetupPrompt({ isOpen, onClose, onSetupComplete }: ReferralsPartnerSetupPromptProps) {
  const [showSetupForm, setShowSetupForm] = useState(false)
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSetupClick = () => {
    // Go directly to the setup form
    setShowSetupForm(true)
  }

  const handleMaybeLater = () => {
    // User chose not to set up partner account - navigate to dashboard
    onClose()
    navigate({ to: '/' })
  }

  const handleSetupComplete = () => {
    // Partner setup completed - close all dialogs and refresh
    setShowSetupForm(false)
    onSetupComplete()
  }

  const handleSetupCancel = () => {
    // User cancelled the setup form - go back to the main prompt
    setShowSetupForm(false)
  }

  return (
    <>
      {/* Main Setup Prompt Dialog */}
      <Dialog open={isOpen && !showSetupForm}>
        <DialogContentNoClose className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="pb-4">Welcome to My Referrals! 🎯</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                To start tracking and managing your referrals, let's quickly set up your Partner account.
              </p>
              <p className="font-medium text-foreground">
                This unlocks your ability to create referrals, track their progress, and earn rewards for successful conversions.
              </p>
              <p className="text-sm text-muted-foreground">
                ⏱️ Takes just 1-2 minutes to complete
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSetupClick} className="flex-1">
              Get Started (1-2 mins)
            </Button>
            <Button variant="outline" onClick={handleMaybeLater} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContentNoClose>
      </Dialog>

      {/* Partner Setup Form Dialog */}
      <Dialog open={showSetupForm} onOpenChange={() => setShowSetupForm(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <ToolkitPartnerSetupForm
            onComplete={handleSetupComplete}
            onCancel={handleSetupCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 
import { useState } from 'react'
import { PartnerSetupPromptProps } from '../types'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog'
import { ToolkitPartnerSetupForm } from './toolkit-partner-setup-form'

export function PartnerSetupPrompt({ isOpen, onClose, onSetupComplete }: PartnerSetupPromptProps) {
  const [showSetupForm, setShowSetupForm] = useState(false)

  if (!isOpen) return null

  const handleSetupClick = () => {
    // Go directly to the setup form (skip the redundant confirmation)
    setShowSetupForm(true)
  }

  const handleMaybeLater = () => {
    // User chose not to set up partner account - redirect back
    onClose()
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
       <Dialog open={isOpen && !showSetupForm} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="pb-4">Welcome to the Referral Toolkit! 🎉</DialogTitle>
             <DialogDescription className="space-y-3">
               <p>
                 To get started with your referral toolkit, let's quickly set up your Partner account.
               </p>
               <p className="font-medium text-foreground">
                 This unlocks your ability to create referral codes, generate QR codes, and earn rewards for successful referrals.
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
         </DialogContent>
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
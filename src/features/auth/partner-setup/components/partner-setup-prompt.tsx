import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PartnerSetupPromptProps {
  open: boolean
  onNo: () => void
  onYes: () => void
}

export function PartnerSetupPrompt({ open, onNo, onYes }: PartnerSetupPromptProps) {
  if (!open) return null

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">
          Create Partner Account?
        </h1>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Partner accounts can earn rewards by referring clients to us.</p>
          <p className="font-medium text-foreground">
            In order to make referrals, you must become a Partner, so this step is necessary before referring people.
          </p>
          <p>You can always set this up later in your profile.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" size="lg" onClick={onNo}>
          No, Maybe Later
        </Button>
        <Button size="lg" onClick={onYes}>
          Yes, Set Up Now
        </Button>
      </div>
    </Card>
  )
} 
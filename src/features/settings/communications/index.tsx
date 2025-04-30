import { Separator } from '@/components/ui/separator' 
import { NotificationsForm } from './notifications-form'

export function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Communications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive communications and updates.
        </p>
      </div>
      <Separator />
      <NotificationsForm />
    </div>
  )
}

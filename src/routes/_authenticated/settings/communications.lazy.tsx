import { createLazyFileRoute } from '@tanstack/react-router'
import { NotificationsSettings } from '@/features/settings/communications/index'

export const Route = createLazyFileRoute(
  '/_authenticated/settings/communications',
)({
  component: NotificationsSettings,
})

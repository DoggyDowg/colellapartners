import { createLazyFileRoute } from '@tanstack/react-router'
import { PartnerDashboard } from './index'

export const Route = createLazyFileRoute('/_authenticated/')({
  component: PartnerDashboard,
})

// The Index function isn't needed, removing it 
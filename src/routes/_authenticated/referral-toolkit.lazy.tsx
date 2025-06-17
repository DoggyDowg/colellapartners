import { createLazyFileRoute } from '@tanstack/react-router'
import { ReferralToolkit } from '../../features/referral-toolkit'

export const Route = createLazyFileRoute('/_authenticated/referral-toolkit')({
  component: ReferralToolkitPage,
})

function ReferralToolkitPage() {
  const { tab } = Route.useSearch()
  return <ReferralToolkit defaultTab={tab} />
} 
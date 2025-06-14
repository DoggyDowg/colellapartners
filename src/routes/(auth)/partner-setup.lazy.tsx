import { createLazyFileRoute } from '@tanstack/react-router'
import PartnerSetup from '@/features/auth/partner-setup'

export const Route = createLazyFileRoute('/(auth)/partner-setup')({
  component: PartnerSetup,
}) 
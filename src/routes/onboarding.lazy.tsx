import { createLazyFileRoute } from '@tanstack/react-router'
import Onboarding from '@/features/auth/onboarding'

export const Route = createLazyFileRoute('/onboarding')({
  component: Onboarding,
}) 
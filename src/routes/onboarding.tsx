import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    return {
      // any data or context needed for the onboarding route
    }
  }
}) 
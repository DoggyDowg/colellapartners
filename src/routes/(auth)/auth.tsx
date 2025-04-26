import { createFileRoute } from '@tanstack/react-router'
import AuthTabs from '@/features/auth/auth-tabs'

export const Route = createFileRoute('/(auth)/auth')({
  component: AuthTabsWrapper,
})

// Wrapper component to handle default tab based on query parameters
function AuthTabsWrapper() {
  // Get query params to determine which tab to show by default
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  
  // Default to login, but show signup tab if mode=register
  const defaultTab = mode === 'register' ? 'register' : 'login'
  
  return <AuthTabs defaultTab={defaultTab} />
} 
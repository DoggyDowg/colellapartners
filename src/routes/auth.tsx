import { createFileRoute, Outlet } from '@tanstack/react-router'
import AuthTabs from '@/features/auth/auth-tabs'

export const Route = createFileRoute('/auth')({
  component: AuthWrapper,
})

function AuthWrapper() {
  // If we're on the OAuth callback path, render the nested AuthCallback component
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
    return <Outlet />
  }
  // Otherwise, show the combined login/signup tabs
  const params = new URLSearchParams(window.location.search)
  const defaultTab = params.get('mode') === 'register' ? 'register' : 'login'
  return <AuthTabs defaultTab={defaultTab} />
} 
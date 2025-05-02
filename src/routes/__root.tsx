import { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'
import { Toaster } from 'sonner'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'
import { useAuthStore } from '@/stores/authStore'

// Define public paths that don't require authentication
// Include root, login, register, onboarding, and the auth callback
const publicPaths = ['/', '/auth', '/auth/login', '/auth/register', '/auth/callback', '/onboarding', '/update-password']

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: ({ location }) => {
    const token = useAuthStore.getState().auth.accessToken
    const isAuthenticated = !!token && token !== ''

    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path))

    // If the user is not authenticated (no valid token) and is trying to access a non-public path...
    if (!isAuthenticated && !isPublicPath) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: location.href,
        },
      })
    }
    // Otherwise (if authenticated or accessing a public path), allow the route to load.
  },
  component: () => {
    return (
      <>
        <Outlet />
        <ShadcnToaster />
        <Toaster richColors position="top-right" />
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})

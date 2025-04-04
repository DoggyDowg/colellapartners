import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'
import { Toaster } from 'sonner'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
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

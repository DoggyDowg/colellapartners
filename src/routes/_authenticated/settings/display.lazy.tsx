import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/settings/display')({
  component: () => <Navigate to="/settings" />,
}) 
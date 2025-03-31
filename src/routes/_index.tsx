import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_index')({
  component: Index,
  beforeLoad: () => {
    return redirect({ to: '/dashboard' });
  }
});

function Index() {
  return (
    <div className="container mx-auto py-10">
      <p>Redirecting...</p>
    </div>
  );
} 
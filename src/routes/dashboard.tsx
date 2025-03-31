import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { SignOutButton } from '../components/auth/SignOutButton';
import { useAuth } from '../context/AuthContext';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <SignOutButton />
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="mb-4">Welcome, {user?.email || 'User'}!</p>
          <p>You are now signed in with Supabase Auth.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Dashboard; 
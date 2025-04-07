import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SignOutButton } from '../../components/auth/SignOutButton';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/header';
import { Search } from '../../components/search';
import { ThemeSwitch } from '../../components/theme-switch';
import { ProfileDropdown } from '../../components/profile-dropdown';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Header title="Dashboard">
        <div className="ml-4 flex-1">
          <Search className="max-w-md" />
        </div>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
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

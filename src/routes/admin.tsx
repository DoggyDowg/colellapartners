import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // First check if the user is authenticated
    if (!loading && !user) {
      navigate({ to: '/auth/login' });
      return;
    }

    // If authenticated, check if user is admin
    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (user) {
      checkAdminRole();
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading || checkingRole) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If not admin, redirect to dashboard
  if (isAdmin === false) {
    navigate({ to: '/dashboard' });
    return null;
  }

  // Render admin layout
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminSidebar() {
  return (
    <div className="w-64 bg-card border-r h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold">Colella Partners</h1>
        <p className="text-sm text-muted-foreground">Admin Portal</p>
      </div>
      <nav className="px-3 py-2">
        <ul className="space-y-1">
          <li>
            <a href="/admin" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/admin/referrals" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Referrals
            </a>
          </li>
          <li>
            <a href="/admin/referrers" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Partners
            </a>
          </li>
          <li>
            <a href="/admin/rewards" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Rewards
            </a>
          </li>
          <li>
            <a href="/admin/events" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Events
            </a>
          </li>
          <li>
            <a href="/admin/raffles" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              Raffles
            </a>
          </li>
          <li>
            <a href="/admin/users" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent">
              User Management
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function AdminHeader() {
  const { signOut } = useAuth();
  
  return (
    <header className="border-b p-4 bg-card">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => signOut()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminLayout; 
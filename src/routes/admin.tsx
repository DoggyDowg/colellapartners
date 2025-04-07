import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '../components/layout/app-sidebar';
import { Header } from '../components/layout/header';
import { SidebarProvider } from '../components/ui/sidebar';
import { SearchProvider } from '../context/search-context';
import { Search } from '../components/search';
import { ProfileDropdown } from '../components/profile-dropdown';
import { ThemeSwitch } from '../components/theme-switch';
import SkipToMain from '../components/skip-to-main';
import { cn } from '../lib/utils';
import Cookies from 'js-cookie';
import supabase from '../lib/supabase';

// A more robust session check that uses localStorage as a fallback
const getSessionAndCheckAdmin = async () => {
  try {
    // First try to get session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session from Supabase, check localStorage
    if (!session) {
      const storedSession = localStorage.getItem('supabase_auth_session');
      if (!storedSession) {
        console.log('No stored session found');
        return null;
      }
      
      // If we have a stored session, refresh it with Supabase
      try {
        const parsedSession = JSON.parse(storedSession);
        await supabase.auth.setSession({
          access_token: parsedSession.access_token,
          refresh_token: parsedSession.refresh_token,
        });
      } catch (err) {
        console.error('Error refreshing stored session:', err);
        localStorage.removeItem('supabase_auth_session');
        return null;
      }
      
      // Re-fetch the session after refreshing
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      if (!refreshedSession) {
        localStorage.removeItem('supabase_auth_session');
        console.log('No refreshed session found');
        return null;
      }
      
      // Check if user is admin with refreshed session
      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      console.log('Admin check with refreshed session:', isAdmin, error);
      return isAdmin ? refreshedSession : null;
    }
    
    // If we have a session directly from Supabase, check if user is admin
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    console.log('Admin check with direct session:', isAdmin, error);
    return isAdmin ? session : null;
  } catch (error) {
    console.error('Error checking admin session:', error);
    return null;
  }
};

// Don't require re-authentication for admin child routes
// Store this value in window for persistence
let isAuthenticated = false;

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  // Use loader to check admin status with robust session checking
  loader: async ({ location }) => {
    console.log('Running admin loader, isAuthenticated:', isAuthenticated);
    
    // Skip authentication check if already authenticated and not on initial load
    // This prevents re-authentication on navigation between admin pages
    if (isAuthenticated && location.pathname !== '/admin') {
      console.log('Already authenticated, skipping check');
      return {};
    }
    
    const session = await getSessionAndCheckAdmin();
    if (!session) {
      console.log('No valid admin session, redirecting to login');
      throw redirect({ to: '/auth/login' });
    }
    
    // Mark as authenticated
    isAuthenticated = true;
    console.log('Authentication successful, setting isAuthenticated to true');
    
    return {};
  },
  // This helps prevent unnecessary re-renders
  loaderDeps: ({ search }) => [search],
});

function AdminLayout() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false';
  
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] duration-200 ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
          )}
        >
          <Header title="Admin Portal">
            <div className="ml-4 flex-1">
              <Search className="max-w-md" />
            </div>
            <div className='ml-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </SearchProvider>
  );
}

export default AdminLayout; 
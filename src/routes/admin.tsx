import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '../components/layout/app-sidebar';
import { Header } from '../components/layout/header';
import { SidebarProvider } from '../components/ui/sidebar';
import { SearchProvider } from '../context/search-context';
import { Search } from '../components/search';
import { cn } from '../lib/utils';
import Cookies from 'js-cookie';
import supabase from '../lib/supabase';
import SkipToMain from '../components/skip-to-main';

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
        return { isAuthenticated: false, isAdmin: false, session: null };
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
        return { isAuthenticated: false, isAdmin: false, session: null };
      }
      
      // Re-fetch the session after refreshing
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      if (!refreshedSession) {
        localStorage.removeItem('supabase_auth_session');
        console.log('No refreshed session found');
        return { isAuthenticated: false, isAdmin: false, session: null };
      }
      
      // Check if user is admin with refreshed session
      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      console.log('Admin check with refreshed session:', isAdmin, error);
      return { 
        isAuthenticated: true, 
        isAdmin: !!isAdmin, 
        session: refreshedSession 
      };
    }
    
    // If we have a session directly from Supabase, check if user is admin
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    console.log('Admin check with direct session:', isAdmin, error);
    return { 
      isAuthenticated: true, 
      isAdmin: !!isAdmin, 
      session 
    };
  } catch (error) {
    console.error('Error checking admin session:', error);
    return { isAuthenticated: false, isAdmin: false, session: null };
  }
};

// Don't require re-authentication for admin child routes
// Store these values globally for persistence across route changes
let isAuthenticated = false;
let isAdminUser = false;

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  // Use loader to check admin status with robust session checking
  loader: async ({ location }) => {
    console.log('Running admin loader, isAuthenticated:', isAuthenticated, 'isAdmin:', isAdminUser);
    
    try {
      // Skip authentication check if already verified and not on initial load
      if ((isAuthenticated && isAdminUser) && location.pathname !== '/admin') {
        console.log('Already verified as admin, skipping check');
        return {};
      }
      
      const { isAuthenticated: hasAuth, isAdmin } = await getSessionAndCheckAdmin();
      
      // Update global flags
      isAuthenticated = hasAuth;
      isAdminUser = isAdmin;
      
      console.log('Auth check results:', { hasAuth, isAdmin });
      
      if (!hasAuth) {
        console.log('User is not authenticated, redirecting to login');
        throw redirect({ to: '/auth/login' });
      }
      
      if (!isAdmin) {
        console.log('User is authenticated but not admin, redirecting to dashboard');
        throw redirect({ to: '/' });
      }
      
      console.log('Admin authentication successful');
      return {};
    } catch (error: any) {
      console.error('Admin auth error:', error);
      
      // If we have an explicit redirect, use it
      if (error.toString().includes('redirect')) {
        throw error;
      }
      
      // For unexpected errors, decide based on authentication state
      if (isAuthenticated) {
        console.log('Error during admin check but user is authenticated, redirecting to dashboard');
        throw redirect({ to: '/' });
      } else {
        console.log('Error during admin check and user is not authenticated, redirecting to login');
        throw redirect({ to: '/auth/login' });
      }
    }
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
            <Search className="max-w-md" />
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
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
import { handleError } from '../utils/error-handler';

// A more robust session check that uses localStorage as a fallback
const getSessionAndCheckAdmin = async () => {
  try {
    // First try to get session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session from Supabase, check localStorage
    if (!session) {
      const storedSession = localStorage.getItem('supabase_auth_session');
      if (!storedSession) {
        return { isAuthenticated: false, isAdmin: false, session: null };
      }
      
      // If we have a stored session, refresh it with Supabase
      try {
        const parsedSession = JSON.parse(storedSession);
        await supabase.auth.setSession({
          access_token: parsedSession.access_token,
          refresh_token: parsedSession.refresh_token,
        });
      } catch (_err) {
        // Handle the error by removing the stored session
        localStorage.removeItem('supabase_auth_session');
        return { isAuthenticated: false, isAdmin: false, session: null };
      }
      
      // Re-fetch the session after refreshing
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      if (!refreshedSession) {
        localStorage.removeItem('supabase_auth_session');
        return { isAuthenticated: false, isAdmin: false, session: null };
      }
      
      // Check if user is admin with refreshed session
      const { data: isAdmin } = await supabase.rpc('is_admin');
      return { 
        isAuthenticated: true, 
        isAdmin: !!isAdmin, 
        session: refreshedSession 
      };
    }
    
    // If we have a session directly from Supabase, check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    return { 
      isAuthenticated: true, 
      isAdmin: !!isAdmin, 
      session 
    };
  } catch (error) {
    handleError(error, {
      context: 'AdminRoute.getSessionAndCheckAdmin',
      showToast: false,
      silent: true // Don't show error in console as this is expected to fail for unauthenticated users
    });
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
    try {
      // Skip authentication check if already verified and not on initial load
      if ((isAuthenticated && isAdminUser) && location.pathname !== '/admin') {
        return {};
      }
      
      const { isAuthenticated: hasAuth, isAdmin } = await getSessionAndCheckAdmin();
      
      // Update global flags
      isAuthenticated = hasAuth;
      isAdminUser = isAdmin;
      
      if (!hasAuth) {
        throw redirect({ to: '/auth' });
      }
      
      if (!isAdmin) {
        throw redirect({ to: '/' });
      }
      
      return {};
    } catch (_error: unknown) {
      // If we have an explicit redirect, use it
      if (_error instanceof Error && _error.toString().includes('redirect')) {
        throw _error;
      }
      
      // For unexpected errors, decide based on authentication state
      if (isAuthenticated) {
        throw redirect({ to: '/' });
      } else {
        throw redirect({ to: '/auth' });
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
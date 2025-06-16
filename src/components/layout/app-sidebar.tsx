import { useEffect, useState } from 'react'
import { Home, Instagram, Facebook, ChevronsUpDown } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NavGroupWithIndicators } from '@/components/layout/nav-group-with-indicators'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import supabase from '@/lib/supabase'
import { useTheme } from '@/context/theme-context'
import { useOrientationStore } from '@/stores/orientationStore'
import { OrientationDialog } from '@/components/orientation/OrientationDialog'

// Utility function for error handling
const logError = (_message: string, _error: unknown): void => {
  // In a production app, you might want to use a proper logging service
  // const errorMessage = _error instanceof Error ? _error.message : String(_error);
  // Silent error handling for UI components
};

// Define the type for nav group items based on existing data
type NavGroupType = typeof sidebarData.navGroups[0];

// Filter function to only show non-admin items
const filterNonAdminItems = (groups: NavGroupType[]): NavGroupType[] => {
  return groups.filter(group => group.title !== 'Admin');
};

// Simple Logo Component for Sidebar Header with External Links Dropdown
function SidebarLogo() {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { theme } = useTheme()

  const lightModeLogo = "/images/custom/colellapartners_logo_landscape.png"
  const darkModeLogo = "/images/custom/colellapartners_logo_landscape_lightversion.png"
  const squareLightModeLogo = "/images/custom/colellapartners_logo_square.png"
  const squareDarkModeLogo = "/images/custom/colellapartners_logo_square_lightversion.png"

  const currentLogo = isCollapsed
    ? (theme === 'dark' ? squareDarkModeLogo : squareLightModeLogo)
    : (theme === 'dark' ? darkModeLogo : lightModeLogo)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size='lg' className='h-12 justify-start px-4'>
              <img 
                src={currentLogo}
                alt="Colella Partners" 
                className={isCollapsed 
                  ? "h-8 w-8 object-contain" 
                  : "h-8 w-auto object-contain"
                }
              />
              {!isCollapsed && <ChevronsUpDown className='ml-auto size-4' />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className='w-56' 
            align='start' 
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <a 
                href="https://www.colella.com.au" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home Page
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a 
                href="https://www.instagram.com/colellaproperty" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a 
                href="https://www.facebook.com/colellaproperty" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { startOrientation } = useOrientationStore()
  
  // Start with non-admin view by default (safer assumption)
  const [navGroups, setNavGroups] = useState(() => {
    // Try to get cached admin status
    const cachedAdminStatus = sessionStorage.getItem('user_is_admin');
    // If cached as admin, show everything; otherwise filter
    return cachedAdminStatus === 'true' 
      ? sidebarData.navGroups 
      : filterNonAdminItems(sidebarData.navGroups);
  });
  
  const [isLoading, setIsLoading] = useState(!sessionStorage.getItem('user_is_admin'));

  useEffect(() => {
    // Check if user is an admin
    const checkAdmin = async () => {
      try {
        // Check if we have a cached result first
        const cachedAdminStatus = sessionStorage.getItem('user_is_admin');
        
        if (cachedAdminStatus !== null) {
          // Use cached result to avoid the API call
          const isAdmin = cachedAdminStatus === 'true';
          setNavGroups(isAdmin ? sidebarData.navGroups : filterNonAdminItems(sidebarData.navGroups));
          setIsLoading(false);
          return;
        }
        
        // If no cached result, check with the server
        const { data: isAdminResult, error } = await supabase.rpc('is_admin');
        
        if (error) {
          logError('Error checking admin status:', error);
          setNavGroups(filterNonAdminItems(sidebarData.navGroups));
          // Cache the result even on error (as non-admin)
          sessionStorage.setItem('user_is_admin', 'false');
        } else {
          // Cache the admin status for future page loads
          sessionStorage.setItem('user_is_admin', isAdminResult ? 'true' : 'false');
          
          // Set the navigation groups based on admin status
          if (isAdminResult) {
            setNavGroups(sidebarData.navGroups);
          } else {
            setNavGroups(filterNonAdminItems(sidebarData.navGroups));
          }
        }
      } catch (err) {
        logError('Error in checkAdmin:', err);
        setNavGroups(filterNonAdminItems(sidebarData.navGroups));
        // Cache the result even on error (as non-admin)
        sessionStorage.setItem('user_is_admin', 'false');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
    
    // Listen for auth state changes to update the sidebar accordingly
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      // Clear the cached admin status when auth state changes
      sessionStorage.removeItem('user_is_admin');
      checkAdmin();
    });
    
    return () => {
      // Clean up auth listener
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Global event listener for orientation:start
  useEffect(() => {
    const handleOrientationStart = () => {
      startOrientation()
    }

    window.addEventListener('orientation:start', handleOrientationStart)
    return () => window.removeEventListener('orientation:start', handleOrientationStart)
  }, [startOrientation]);

  // If we're still loading and don't have a cached status, only show non-admin items
  if (isLoading) {
    return (
      <>
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          <SidebarLogo />
        </SidebarHeader>
        <SidebarContent>
          {filterNonAdminItems(sidebarData.navGroups).map((props) => (
            <NavGroupWithIndicators key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser fallbackUser={sidebarData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
        <OrientationDialog />
      </>
    );
  }

  return (
    <>
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
                <SidebarContent>
        {navGroups.map((props) => (
          <NavGroupWithIndicators key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser fallbackUser={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
      <OrientationDialog />
    </>
  )
}

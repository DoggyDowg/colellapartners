import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'
import supabase from '@/lib/supabase'

// Define the type for nav group items based on existing data
type NavGroupType = typeof sidebarData.navGroups[0];

// Filter function to only show non-admin items
const filterNonAdminItems = (groups: NavGroupType[]): NavGroupType[] => {
  return groups.filter(group => group.title !== 'Admin');
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          console.error('Error checking admin status:', error);
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
        console.error('Error in checkAdmin:', err);
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

  // If we're still loading and don't have a cached status, only show non-admin items
  if (isLoading) {
    return (
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={sidebarData.teams} />
        </SidebarHeader>
        <SidebarContent>
          {filterNonAdminItems(sidebarData.navGroups).map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser fallbackUser={sidebarData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser fallbackUser={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

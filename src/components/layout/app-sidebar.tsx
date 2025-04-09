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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navGroups, setNavGroups] = useState(sidebarData.navGroups);

  useEffect(() => {
    // Check if user is an admin
    const checkAdmin = async () => {
      try {
        const { data: isAdminResult, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
        } else {
          // Filter nav groups based on admin status
          if (!isAdminResult) {
            // If not admin, filter out the admin section
            setNavGroups(sidebarData.navGroups.filter(group => group.title !== 'Admin'));
          } else {
            setNavGroups(sidebarData.navGroups);
          }
        }
      } catch (err) {
        console.error('Error in checkAdmin:', err);
        setNavGroups(sidebarData.navGroups.filter(group => group.title !== 'Admin'));
      }
    };
    
    checkAdmin();
  }, []);

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

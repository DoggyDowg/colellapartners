import {
  ChevronsUpDown,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { ProfileDropdown } from '@/components/profile-dropdown'

// Accept fallback data in case auth context isn't loaded yet
export function NavUser({
  fallbackUser,
}: {
  fallbackUser?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const { getProfilePicture, profile } = useUserProfile()

  // Use real user data from auth context if available
  // First try user_metadata.name, then try to extract display name from email
  const displayName = 
    profile?.name || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    user?.email?.split('@')[0] || 
    fallbackUser?.name || 
    'User'
    
  const email = profile?.email || user?.email || fallbackUser?.email || ''
  const avatarSrc = getProfilePicture()
  
  // Generate initials for avatar fallback
  const initials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : email
      ? email.substring(0, 2).toUpperCase()
      : 'U'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileDropdown 
          align='end' 
          side={isMobile ? 'bottom' : 'right'}
        >
          <SidebarMenuButton
            size='lg'
            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage src={avatarSrc} alt={displayName} className="scale-125" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{displayName}</span>
              <span className='truncate text-xs'>{email}</span>
            </div>
            <ChevronsUpDown className='ml-auto size-4' />
          </SidebarMenuButton>
        </ProfileDropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

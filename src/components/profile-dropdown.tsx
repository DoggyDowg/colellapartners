import { Link, useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Bell, LogOut, SquareUser } from 'lucide-react'

interface ProfileDropdownProps {
  children?: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function ProfileDropdown({ children, align = 'end', side = 'bottom' }: ProfileDropdownProps) {
  const { signOut, user } = useAuth()
  const { getProfilePicture } = useUserProfile()
  const navigate = useNavigate()

  // Use real user data from auth context if available
  const displayName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    user?.email?.split('@')[0] || 
    'User'
    
  const email = user?.email || ''
  const avatarSrc = getProfilePicture()
  
  // Generate initials for avatar fallback
  const initials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : email
      ? email.substring(0, 2).toUpperCase()
      : 'U'

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/auth' })
  }

  // Default trigger if none provided
  const defaultTrigger = (
    <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
      <Avatar className='h-8 w-8'>
        <AvatarImage src={avatarSrc} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Button>
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {children || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align={align} side={side} forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/settings'>
              <SquareUser className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/notifications'>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

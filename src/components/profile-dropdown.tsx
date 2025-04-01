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
import { useAuth } from '@/context/AuthContext'
import { BadgeCheck, Bell, LogOut } from 'lucide-react'

export function ProfileDropdown() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  // Use real user data from auth context if available
  const displayName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    user?.email?.split('@')[0] || 
    'User'
    
  const email = user?.email || ''
  const avatarSrc = user?.user_metadata?.avatar_url || '/avatars/01.png'
  
  // Generate initials for avatar fallback
  const initials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : email
      ? email.substring(0, 2).toUpperCase()
      : 'U'

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/auth/login' })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatarSrc} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
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
            <Link to='/settings/account'>
              <BadgeCheck className="mr-2 h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/settings/notifications'>
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

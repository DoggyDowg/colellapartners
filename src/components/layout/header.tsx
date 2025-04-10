import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ReferralCTAButton } from '@/components/referrals/ReferralCTAButton'
import supabase from '../../lib/supabase'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
  title?: string
}

export const Header = ({
  className,
  fixed,
  title,
  children,
  ...props
}: HeaderProps) => {
  const [offset, setOffset] = React.useState(0)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const { data } = await supabase.rpc('is_admin')
        setIsAdmin(!!data)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'flex h-16 items-center gap-3 bg-background p-4 sm:gap-4',
        fixed && 'header-fixed peer/header fixed z-50 w-[inherit] rounded-md',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
      <Separator orientation='vertical' className='h-6' />
      
      {title && (
        <h1 className="text-xl font-semibold">{title}</h1>
      )}
      
      {/* Only show custom content (search bar) for admin users */}
      {isAdmin && children && (
        <div className="flex-1">
          {children}
        </div>
      )}
      
      {/* Always include these components on the right */}
      <div className={cn('flex items-center space-x-4', !isAdmin || !children ? 'ml-auto' : '')}>
        <ReferralCTAButton />
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </header>
  )
}

Header.displayName = 'Header'

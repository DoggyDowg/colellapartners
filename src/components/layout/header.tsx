import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ReferralCTAButton } from '@/components/referrals/ReferralCTAButton'
import supabase from '../../lib/supabase'
import { useTheme } from '@/context/theme-context'

// Utility function for error handling
const logError = (_message: string, _error: unknown): void => {
  // In a production app, you might want to use a proper logging service
  // const errorMessage = _error instanceof Error ? _error.message : String(_error);
  // Silent error handling for UI components
};

// Custom branded sidebar trigger for mobile/tablet
const BrandedSidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  const { theme } = useTheme()

  const squareLightModeLogo = "/images/custom/colellapartners_logo_square.png"
  const squareDarkModeLogo = "/images/custom/colellapartners_logo_square_lightversion.png"

  const currentMobileLogo = theme === 'dark' ? squareDarkModeLogo : squareLightModeLogo

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="outline"
      size="sm"
      className={cn('h-10 w-10 p-1', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <img
        src={currentMobileLogo}
        alt="Colella Partners"
        className="h-full w-full object-contain"
      />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
BrandedSidebarTrigger.displayName = 'BrandedSidebarTrigger'

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
        logError('Error checking admin status:', error)
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
      {/* Show branded trigger on mobile/tablet, original on desktop */}
      <div className="md:hidden">
        <BrandedSidebarTrigger />
      </div>
      <div className="hidden md:block">
        <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
      </div>
      
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
      <div className={cn('flex items-center space-x-2 sm:space-x-4', !isAdmin || !children ? 'ml-auto' : '')}>
        <ReferralCTAButton />
        {/* Hide theme switch on mobile */}
        <div className="hidden sm:block">
          <ThemeSwitch />
        </div>
        {/* Hide profile dropdown on mobile */}
        <div className="hidden sm:block">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

Header.displayName = 'Header'

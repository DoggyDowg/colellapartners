import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar 
} from '../ui/sidebar'
import { useNotifications } from '../../hooks/useNotifications'
import { IconBell } from '@tabler/icons-react'

export const NotificationNavItem: React.FC = () => {
  const { setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  const { unreadCount } = useNotifications()
  
  const item = {
    title: 'Notifications',
    url: '/notifications',
    icon: IconBell
  }
  
  const isActive = pathname === item.url

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip="Notifications"
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          <IconBell />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <div className="flex items-center justify-center ml-auto rounded-full bg-red-500 text-white text-xs font-medium min-w-5 h-5 px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
} 
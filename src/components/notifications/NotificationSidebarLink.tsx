import React from 'react'
import { IconBell } from '@tabler/icons-react'
import { useNotifications } from '../../hooks/useNotifications'
import { NavLink } from '../layout/types'

export function createNotificationNavItem(): NavLink {
  return {
    title: 'Notifications',
    url: '/notifications',
    icon: IconBell,
  }
}

// This component will be used in the NavGroup component to render the notification badge
export const NotificationIndicator: React.FC = () => {
  const { unreadCount } = useNotifications()
  
  // Don't render anything if there are no unread notifications
  if (unreadCount === 0) return null

  return (
    <div className="flex items-center justify-center ml-auto rounded-full bg-red-500 text-white text-xs font-medium min-w-5 h-5 px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  )
} 
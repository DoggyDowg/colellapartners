import React from 'react'
import { useNotifications } from '../../hooks/useNotifications'

type NotificationIndicatorProps = {
  className?: string
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({ className }) => {
  const { unreadCount } = useNotifications()
  
  // Don't render anything if there are no unread notifications
  if (unreadCount === 0) return null

  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium min-w-5 h-5 px-1 ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  )
} 
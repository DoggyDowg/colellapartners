import React, { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'
import supabase from '../lib/supabase'
import { Notification } from '../hooks/useNotifications'

type NotificationsContextType = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const defaultContext: NotificationsContextType = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
}

const NotificationsContext = createContext<NotificationsContextType>(defaultContext)

export const useNotificationsContext = () => useContext(NotificationsContext)

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch all notifications for the user
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setNotifications(data || [])
      
      // Calculate unread count
      const unread = data?.filter(n => !n.is_read)?.length || 0
      setUnreadCount(unread)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Error fetching notifications: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Function to mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true } 
            : n
        )
      )

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Error marking notification as read: ${errorMessage}`)
    }
  }, [user])

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      
      // Reset unread count
      setUnreadCount(0)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Error marking all notifications as read: ${errorMessage}`)
    }
  }, [user])

  // Setup a subscription to notifications for real-time updates
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchNotifications()

    // Set up real-time subscription for this user's notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Different handling based on event type
          if (payload.eventType === 'INSERT') {
            // A new notification
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            if (!newNotification.is_read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            // An updated notification (e.g., marked as read)
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            // Recalculate unread count
            fetchNotifications()
          } else if (payload.eventType === 'DELETE') {
            // A deleted notification
            const deletedNotification = payload.old as Notification
            setNotifications(prev => 
              prev.filter(n => n.id !== deletedNotification.id)
            )
            // Recalculate unread count
            fetchNotifications()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
} 
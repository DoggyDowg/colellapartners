import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '../../components/layout/header'
import { useNotifications, Notification } from '../../hooks/useNotifications'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { IconCheck, IconBell, IconCalendar, IconRefresh } from '@tabler/icons-react'
import { Badge } from '../../components/ui/badge'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications()
  
  const [markingRead, setMarkingRead] = useState(false)

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Function to get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_referral':
      case 'referral_update':
        return <IconBell className="h-5 w-5 text-blue-500" />
      case 'new_reward':
      case 'reward_update':
        return <IconBell className="h-5 w-5 text-green-500" />
      case 'achievement_unlocked':
        return <IconBell className="h-5 w-5 text-amber-500" />
      default:
        return <IconBell className="h-5 w-5 text-gray-500" />
    }
  }

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    setMarkingRead(true)
    await markAllAsRead()
    setMarkingRead(false)
  }
  
  // Handle refresh
  const handleRefresh = async () => {
    await fetchNotifications()
  }

  return (
    <>
      <Header title="Notifications" />
      <div className="container py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                View all of your account notifications and updates
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                onClick={handleMarkAllAsRead} 
                disabled={markingRead || loading || notifications.every(n => n.is_read)}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Mark All as Read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex justify-center p-6">
                <p className="text-red-500">{error}</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center p-6">
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <IconBell className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No notifications yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When you have notifications, they'll appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow 
                      key={notification.id} 
                      className={notification.is_read ? '' : 'bg-blue-50 dark:bg-blue-950'}
                    >
                      <TableCell>
                        {getNotificationIcon(notification.type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {notification.message}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <IconCalendar className="mr-2 h-4 w-4 text-gray-400" />
                          {formatDate(notification.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.is_read ? (
                          <Badge variant="outline" className="text-gray-500 bg-gray-100">Read</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(notification.id)}
                          >
                            <IconCheck className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
} 
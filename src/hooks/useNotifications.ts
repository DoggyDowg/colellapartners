import { useNotificationsContext } from '../providers/NotificationsProvider'

// Define the Notification interface
export interface Notification {
  id: string
  user_id: string
  type: 'new_referral' | 'referral_update' | 'new_reward' | 'reward_update' | 'achievement_unlocked'
  message: string
  related_entity_id: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  return useNotificationsContext()
} 
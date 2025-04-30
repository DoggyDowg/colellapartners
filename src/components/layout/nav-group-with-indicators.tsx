import { useMemo } from 'react';
import { NavGroup as OriginalNavGroup } from './nav-group';
import { type NavGroup } from './types';
import { useActionIndicators } from '@/hooks/useActionIndicators';
import { NotificationDot } from '@/components/ui/notification-dot';
import { useNotifications } from '@/hooks/useNotifications';

export function NavGroupWithIndicators({ title, items }: NavGroup) {
  const { 
    profileIncomplete, 
    communicationPreferencesMissing, 
    hasSettingsActions 
  } = useActionIndicators();
  
  const { unreadCount } = useNotifications();

  // Deep clone and augment navigation items with notification indicators
  const enhancedItems = useMemo(() => {
    return items.map(item => {
      // Clone the item first
      const newItem = { ...item };
      
      // For the Settings section
      if (item.title === 'Settings' && hasSettingsActions) {
        // Add the notification component
        newItem.notificationIndicator = <NotificationDot />;
        
        // If it has subitems, check which ones need indicators
        if (newItem.items) {
          newItem.items = newItem.items.map(subItem => {
            const newSubItem = { ...subItem };
            
            // Add indicators to specific sub-items if needed
            if (subItem.title === 'Profile' && profileIncomplete) {
              newSubItem.notificationIndicator = <NotificationDot />;
            }
            
            if (subItem.title === 'Communications' && communicationPreferencesMissing) {
              newSubItem.notificationIndicator = <NotificationDot />;
            }
            
            return newSubItem;
          });
        }
      }
      
      // Add notification badge to Notifications item
      if (item.title === 'Notifications' && unreadCount > 0) {
        newItem.notificationIndicator = (
          <div className="flex items-center justify-center ml-auto rounded-full bg-red-500 text-white text-xs font-medium min-w-5 h-5 px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        );
      }
      
      return newItem;
    });
  }, [items, profileIncomplete, communicationPreferencesMissing, hasSettingsActions, unreadCount]);
  
  return <OriginalNavGroup title={title} items={enhancedItems} />;
} 
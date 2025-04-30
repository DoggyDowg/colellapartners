import { useMemo } from 'react';
import { NavGroup as OriginalNavGroup } from './nav-group';
import { type NavGroup } from './types';
import { useActionIndicators } from '@/hooks/useActionIndicators';
import { NotificationDot } from '@/components/ui/notification-dot';

export function NavGroupWithIndicators({ title, items }: NavGroup) {
  const { 
    profileIncomplete, 
    communicationPreferencesMissing, 
    hasSettingsActions 
  } = useActionIndicators();

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
      
      return newItem;
    });
  }, [items, profileIncomplete, communicationPreferencesMissing, hasSettingsActions]);
  
  return <OriginalNavGroup title={title} items={enhancedItems} />;
} 
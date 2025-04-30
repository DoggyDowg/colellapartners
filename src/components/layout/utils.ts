import { NavCollapsible, NavLink } from './types'

/**
 * Check if a navigation item is active based on the current URL
 */
export function checkIsActive(
  currentHref: string,
  item: NavLink | NavCollapsible,
  checkChildren = false
): boolean {
  // Simple case: direct URL match
  if ('url' in item && currentHref === item.url) {
    return true
  }

  // For items with children, check if any child is active
  if (checkChildren && 'items' in item && item.items) {
    return item.items.some(subItem => currentHref === subItem.url)
  }

  return false
} 
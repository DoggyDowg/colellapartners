// React 19 polyfill for useSyncExternalStoreWithSelector
import { useSyncExternalStore } from 'react'

// Polyfill for useSyncExternalStoreWithSelector that Zustand needs
export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  _isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const slice = useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    getServerSnapshot ? () => selector(getServerSnapshot()) : undefined
  )
  
  return slice
}

// Also export as default to match the expected module structure
export default useSyncExternalStoreWithSelector

// Patch the global object for libraries that expect it
if (typeof window !== 'undefined') {
  (window as any).useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector
}

// For Node.js environment
if (typeof global !== 'undefined') {
  (global as any).useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector
} 
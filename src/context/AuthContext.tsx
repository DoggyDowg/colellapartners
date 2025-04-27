/**
 * @deprecated This file is being refactored into separate files for better React Fast Refresh support.
 * Please import from the following files instead:
 * - import { AuthContext, type AuthContextType } from './AuthContext'; // For the context
 * - import { AuthProvider } from './AuthProvider'; // For the provider component
 */

// Re-export everything from the new files
export { AuthContext } from './AuthContext';
export type { AuthContextType } from './AuthContext';
export { AuthProvider } from './AuthProvider'; 
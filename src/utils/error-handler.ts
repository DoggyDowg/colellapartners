import { toast } from 'sonner'; // Using the same toast library from the project
import { logger } from './logger';

type ErrorHandlingOptions = {
  userId?: string;
  context?: string;
  showToast?: boolean;
  toastMessage?: string;
  silent?: boolean;
}

/**
 * Centralized error handling function
 */
export function handleError(
  error: unknown, 
  options: ErrorHandlingOptions = {}
) {
  const { 
    userId, 
    context = 'general', 
    showToast = true, 
    toastMessage = "An error occurred", 
    silent = false 
  } = options;
  
  // Extract error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
  
  // Only log in development environment
  if (import.meta.env.DEV && !silent) {
    // Using our logger utility instead of direct console.error
    logger.error(`Error in [${context}]`, error, { userId });
  }
  
  // Show toast notification if needed
  if (showToast) {
    toast.error(toastMessage);
  }
  
  // Here you could add integration with error monitoring service
  // Example: Sentry.captureException(error, { extra: { userId, context } });
  
  return errorMessage;
} 
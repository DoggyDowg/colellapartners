# Console Statement Refactoring Plan

## 1. Audit and Categorize Existing Console Statements

- **Error Logging**: Most console.error statements in catch blocks
- **Debug Logging**: console.log statements for development debugging
- **Warning Logging**: console.warn statements for potential issues

## 2. Create a Centralized Error Handling Utility

```tsx
// src/utils/error-handler.ts

import { toast } from 'sonner'; // Using the same toast library from the project

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
    // Using a structured format to make debugging easier
    console.error(`[${context}]`, { error, userId });
  }
  
  // Show toast notification if needed
  if (showToast) {
    toast.error(toastMessage);
  }
  
  // Here you could add integration with error monitoring service
  // Example: Sentry.captureException(error, { extra: { userId, context } });
  
  return errorMessage;
}
```

## 3. Create UI Error Components

```tsx
// src/components/ui/error-state.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = 'Something went wrong', 
  onRetry 
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <p className="text-destructive mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry}>Try Again</Button>
        )}
      </CardContent>
    </Card>
  );
}
```

## 4. Replace Console Statements - Examples

### Example 1: Refactoring error handling in PropertyDetail component

```tsx
// Original code
useEffect(() => {
  async function fetchPropertyDetails() {
    setLoading(true);
    setError(null);
    
    try {
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);
    } catch (_err) {
      setError('Unable to load property details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  fetchPropertyDetails();
}, [id]);
```

```tsx
// Refactored code
import { handleError } from '@/utils/error-handler';

useEffect(() => {
  async function fetchPropertyDetails() {
    setLoading(true);
    setError(null);
    
    try {
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'PropertyDetail.fetchPropertyDetails',
        toastMessage: 'Unable to load property details'
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  fetchPropertyDetails();
}, [id]);
```

### Example 2: Refactoring PartnerReferralForm component

```tsx
// Original code
try {
  // Form submission logic
} catch (error: any) {
  console.error('Error submitting partner referral:', error);
  toast({
    title: "Submission failed",
    description: error.message || "There was a problem submitting your referral. Please try again.",
    variant: "destructive"
  });
}
```

```tsx
// Refactored code
try {
  // Form submission logic
} catch (error: any) {
  handleError(error, {
    context: 'PartnerReferralForm.onSubmit',
    toastMessage: "There was a problem submitting your referral",
    showToast: true
  });
}
```

## 5. Implement Environment-Based Logging

For any essential console logs that must remain:

```tsx
// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: unknown, ...args: any[]) => {
    // Always log errors, but with environment check
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
    // In production, could send to monitoring service
  }
};
```

## 6. Prioritization Strategy

1. **High Priority**:
   - Fix console statements in user-facing components
   - Replace console.error in critical paths (authentication, data submission)

2. **Medium Priority**:
   - Error handling in admin components
   - Replace console statements in form validation

3. **Low Priority**:
   - Utility functions
   - Test files

## 7. Implementation Steps

1. Create the error handling and logging utilities
2. Start with refactoring one component as a proof of concept
3. Implement the error handling pattern across similar components
4. Run ESLint to verify no console statements remain
5. Add ESLint rule to prevent future console statements: `"no-console": ["error"]` 
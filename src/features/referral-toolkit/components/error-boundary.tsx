import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Referral Toolkit Error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log to error reporting service in production
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-600">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Bug className="h-4 w-4" />
            <AlertDescription>
              We're sorry, but something unexpected happened in the referral toolkit. 
              Please try refreshing the page or contact support if the problem persists.
            </AlertDescription>
          </Alert>

          {isDevelopment && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Development Details:</h4>
              <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              If this problem continues, please contact support at{' '}
              <a 
                href="mailto:support@colellapartners.com.au" 
                className="text-blue-600 hover:underline"
              >
                support@colellapartners.com.au
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Custom error fallback for specific components
export function ToolkitErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <div>
            <h3 className="font-medium text-red-600">Toolkit Error</h3>
            <p className="text-sm text-red-500 mt-1">
              {error.message || 'An error occurred in the referral toolkit'}
            </p>
          </div>
          <Button onClick={resetError} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    setError(errorObj)
    console.error('Async error caught:', errorObj)
  }, [])

  // Throw error to be caught by Error Boundary
  if (error) {
    throw error
  }

  return { handleError, resetError }
} 
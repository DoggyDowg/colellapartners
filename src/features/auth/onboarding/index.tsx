import { Card } from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { OnboardingForm } from './components/onboarding-form'
import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// Custom error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CustomErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error("Onboarding form error:", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Card className="p-6">
          <div className="mb-4 flex flex-col space-y-2 text-left">
            <h1 className="text-lg font-semibold tracking-tight text-destructive">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading the form. Please try again.
            </p>
            {this.state.error && (
              <pre className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default function Onboarding() {
  return (
    <AuthLayout>
      <CustomErrorBoundary>
        <Card className='p-6'>
          <div className='mb-4 flex flex-col space-y-2 text-left'>
            <h1 className='text-lg font-semibold tracking-tight'>
              Complete Your Profile
            </h1>
            <p className='text-sm text-muted-foreground'>
              Please provide the following information to complete your account setup.
            </p>
          </div>
          <OnboardingForm />
        </Card>
      </CustomErrorBoundary>
    </AuthLayout>
  )
} 
import { Button } from './button';
import { Card, CardContent } from './card';

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
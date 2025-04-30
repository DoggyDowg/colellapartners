import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  variant?: 'default' | 'warning' | 'info';
}

export function NotificationDot({ 
  className, 
  variant = 'default',
  ...props 
}: NotificationDotProps) {
  // Get variant-specific styling
  const variantStyles = {
    default: 'bg-destructive',
    warning: 'bg-warning',
    info: 'bg-primary'
  };

  return (
    <span
      className={cn(
        'absolute top-1.5 right-1.5 h-2 w-2 rounded-full',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
} 
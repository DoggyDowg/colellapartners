import { cn } from '../../lib/utils'

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  className?: string
}

export function Spinner({ size = 'medium', text = 'Loading...', className = '' }: SpinnerProps) {
  // Size values in pixels
  const sizeValues = {
    small: 30,
    medium: 50,
    large: 70
  }

  // Border width based on size
  const borderWidth = {
    small: 6,
    medium: 8,
    large: 10
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div 
        className="spinner"
        style={{ 
          width: `${sizeValues[size]}px`,
          height: `${sizeValues[size]}px`,
          borderWidth: `${borderWidth[size]}px`,
          aspectRatio: 1,
          borderRadius: '50%',
          borderColor: 'hsl(var(--primary))',
          borderStyle: 'solid',
          animation: 'spinner-clip 0.8s infinite linear alternate, spinner-rotate 1.6s infinite linear'
        }}
      />
      {text && <p className="mt-4 text-muted-foreground">{text}</p>}
    </div>
  )
} 
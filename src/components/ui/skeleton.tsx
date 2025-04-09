import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-md bg-muted/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:border-t before:border-muted-foreground/10 before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/20 before:to-transparent',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

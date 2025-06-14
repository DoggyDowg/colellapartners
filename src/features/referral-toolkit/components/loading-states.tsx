import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { Loader2, Download, QrCode, FileText, Upload } from 'lucide-react'
import { cn } from '../../../lib/utils'

// Generic loading spinner
export function LoadingSpinner({ size = 'default', className }: { 
  size?: 'sm' | 'default' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

// Full page loading
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading referral toolkit...</p>
      </div>
    </div>
  )
}

// Skeleton for partner setup form
export function PartnerSetupSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business details section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Partner code section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Logo upload section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center space-y-3">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-48 mx-auto" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for QR code generator
export function QRCodeGeneratorSkeleton() {
  return (
    <div className="space-y-6">
      {/* QR Code Preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-8 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Customization Options */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton for PDF generator
export function PDFGeneratorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading button with spinner
export function LoadingButton({ 
  children, 
  isLoading, 
  loadingText,
  className,
  ...props 
}: {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  className?: string
  [key: string]: any
}) {
  return (
    <button
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center space-x-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  )
}

// Loading overlay for components
export function LoadingOverlay({ 
  isLoading, 
  children, 
  message = 'Loading...' 
}: {
  isLoading: boolean
  children: React.ReactNode
  message?: string
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Progress bar for multi-step processes
export function ProgressBar({ 
  currentStep, 
  totalSteps, 
  className 
}: {
  currentStep: number
  totalSteps: number
  className?: string
}) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100)

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Inline loading state for small components
export function InlineLoading({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span>{text}...</span>
    </div>
  )
}

// Download progress indicator
export function DownloadProgress({ 
  isDownloading, 
  progress, 
  fileName 
}: {
  isDownloading: boolean
  progress?: number
  fileName?: string
}) {
  if (!isDownloading) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center space-x-3">
        <Download className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {fileName ? `Downloading ${fileName}` : 'Downloading...'}
          </p>
          {progress !== undefined && (
            <div className="mt-2">
              <ProgressBar currentStep={progress} totalSteps={100} />
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
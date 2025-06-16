import { useState, useEffect } from 'react'

interface OrientationVideoProps {
  video?: string
  title: string
  className?: string
}

export function OrientationVideo({
  video,
  title,
  className = ''
}: OrientationVideoProps) {
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use the single video source
  const videoSrc = video

  useEffect(() => {
    setVideoError(false)
    setIsLoading(true)
  }, [videoSrc])

  const handleVideoLoad = () => {
    setIsLoading(false)
  }

  const handleVideoError = () => {
    setVideoError(true)
    setIsLoading(false)
  }

  // Don't render anything if no video available
  if (!videoSrc) {
    return null
  }

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </div>
      )}
      
      {videoError ? (
        <div className="flex items-center justify-center bg-muted rounded-lg p-8">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Video preview will be here</p>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {title} demonstration
            </p>
          </div>
        </div>
      ) : (
        <video
          key={videoSrc}
          className="w-full h-auto rounded-lg shadow-sm"
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={{
            aspectRatio: '16/9'
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  )
} 
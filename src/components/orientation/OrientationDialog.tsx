import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  IconArrowLeft, 
  IconArrowRight, 
  IconPlayerSkipForward,
  IconSparkles 
} from '@tabler/icons-react'
import { useOrientationStore, getValidSlidesForRole } from '@/stores/orientationStore'
import { OrientationVideo } from './OrientationVideo'
import { useAuth } from '@/hooks/useAuth'

export function OrientationDialog() {
  const { user } = useAuth()
  const {
    isActive,
    currentSlide,
    userRole,
    endOrientation,
    nextSlide,
    previousSlide,
    skipOrientation,
    setUserRole
  } = useOrientationStore()

  // Set user role - simplified since everyone sees the same flow
  useEffect(() => {
    if (user && !userRole) {
      // Default to partner since everyone sees the same orientation
      setUserRole('partner')
    }
  }, [user, userRole, setUserRole])

  // Don't render if not active or no user role
  if (!isActive || !userRole) {
    return null
  }

  const validSlides = getValidSlidesForRole(userRole)
  const currentSlideData = validSlides[currentSlide]
  
  if (!currentSlideData) {
    return null
  }

  const progress = ((currentSlide + 1) / validSlides.length) * 100
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === validSlides.length - 1
  const hasVideo = !!currentSlideData.video

  const handleNext = () => {
    if (isLastSlide) {
      endOrientation()
    } else {
      nextSlide()
    }
  }

  const handleClose = () => {
    skipOrientation()
  }

  return (
    <Dialog open={isActive} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <IconSparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentSlideData.title}</h2>
              <div className="text-sm text-muted-foreground">
                <span>Step {currentSlide + 1} of {validSlides.length}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Getting Started</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {hasVideo ? (
            // Two-column layout with video
            <div className="grid lg:grid-cols-2 gap-8 p-8 pt-5 h-full min-h-[600px]">
              {/* Video Section */}
              <div className="flex justify-center pt-5">
                <OrientationVideo
                  video={currentSlideData.video}
                  title={currentSlideData.title}
                  className="w-full"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col pt-5 space-y-8">
                <div className="prose prose-base max-w-none">
                  <div 
                    className="whitespace-pre-line text-base leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: currentSlideData.content.replace(
                        /\*\*(.*?)\*\*/g, 
                        '<strong>$1</strong>'
                      )
                    }}
                  />
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={previousSlide}
                      disabled={isFirstSlide}
                      className="flex-1 h-12 text-base"
                    >
                      <IconArrowLeft className="h-5 w-5 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      className="flex-1 h-12 text-base"
                    >
                      {currentSlideData.nextButtonText}
                      {!isLastSlide && <IconArrowRight className="h-5 w-5 ml-2" />}
                    </Button>
                  </div>

                  {/* Skip Option */}
                  {!isLastSlide && (
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={handleClose}
                      className="text-muted-foreground hover:text-foreground h-10"
                    >
                      <IconPlayerSkipForward className="h-4 w-4 mr-2" />
                      Skip orientation
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Single-column centered layout without video - Compact scrollable design
            <div className="overflow-y-auto p-8 pt-5 h-full min-h-[600px]">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                {/* Celebration Header */}
                <div className="mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <IconSparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Congratulations!</h3>
                  <p className="text-muted-foreground">
                    You now know how to use all the key features of your Colella Partners referral dashboard.
                  </p>
                </div>

                {/* Ready To Section */}
                <div className="bg-muted/30 rounded-lg p-4 mb-4 max-w-fit mx-auto">
                  <h4 className="font-semibold mb-3">You're ready to:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Start referring clients right away</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Use professional tools to promote your business</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Track your success and earnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Build a rewarding referral business</span>
                    </div>
                  </div>
                </div>

                {/* Reminder Section */}
                <div className="bg-muted/20 border rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> You can restart this orientation anytime from the "Other" section in your sidebar menu.
                  </p>
                </div>

                {/* Call to Action */}
                <div className="mb-4">
                  <p className="font-medium">Ready to start earning some great referral rewards?</p>
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                    <Button
                      variant="outline"
                      onClick={previousSlide}
                      disabled={isFirstSlide}
                      className="flex-1 h-10"
                    >
                      <IconArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      className="flex-1 h-10"
                    >
                      {currentSlideData.nextButtonText}
                      {!isLastSlide && <IconArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </div>

                  {/* Skip Option */}
                  {!isLastSlide && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="text-muted-foreground hover:text-foreground mx-auto"
                    >
                      <IconPlayerSkipForward className="h-4 w-4 mr-2" />
                      Skip orientation
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
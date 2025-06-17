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
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] sm:h-[90vh] p-0 gap-0 flex flex-col rounded-lg sm:rounded-xl">
        {/* Header - Fixed at top */}
        <DialogHeader className="flex-shrink-0 p-4 sm:p-8 pb-4 sm:pb-6 space-y-4 border-b bg-background rounded-t-lg sm:rounded-t-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
              <IconSparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">{currentSlideData.title}</h2>
              <div className="text-xs sm:text-sm text-muted-foreground">
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {hasVideo ? (
            // Two-column layout with video - responsive
            <div className="flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8 pt-3 sm:pt-5">
                {/* Video Section */}
                <div className="flex justify-center order-1 lg:order-none">
                  <OrientationVideo
                    video={currentSlideData.video}
                    title={currentSlideData.title}
                    className="w-full max-w-md lg:max-w-none"
                  />
                </div>

                {/* Content Section */}
                <div className="flex flex-col space-y-4 sm:space-y-8 order-2 lg:order-none">
                  <div className="prose prose-sm sm:prose-base max-w-none">
                    <div 
                      className="whitespace-pre-line text-sm sm:text-base leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: currentSlideData.content.replace(
                          /\*\*(.*?)\*\*/g, 
                          '<strong>$1</strong>'
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Single-column centered layout without video - Mobile optimized
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-8 pt-3 sm:pt-5">
                <div className="max-w-2xl mx-auto text-center space-y-3 sm:space-y-4">
                  {/* Celebration Header */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10">
                        <IconSparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2">Congratulations!</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      You now know how to use all the key features of your Colella Partners referral dashboard.
                    </p>
                  </div>

                  {/* Ready To Section */}
                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 max-w-fit mx-auto">
                    <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">You're ready to:</h4>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                        <span>Start referring clients right away</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                        <span>Use professional tools to promote your business</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                        <span>Track your success and earnings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                        <span>Build a rewarding referral business</span>
                      </div>
                    </div>
                  </div>

                  {/* Reminder Section */}
                  <div className="bg-muted/20 border rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Tip:</strong> You can restart this orientation anytime from the "Other" section in your sidebar menu.
                    </p>
                  </div>

                  {/* Call to Action */}
                  <div className="mb-3 sm:mb-4">
                    <p className="font-medium text-sm sm:text-base">Ready to start earning some great referral rewards?</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background p-4 sm:p-8 pt-4 sm:pt-6 rounded-b-lg sm:rounded-b-xl">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={previousSlide}
                    disabled={isFirstSlide}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base max-w-[200px] sm:max-w-none"
                  >
                    <IconArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base max-w-[200px] sm:max-w-none"
                  >
                    {currentSlideData.nextButtonText}
                    {!isLastSlide && <IconArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                  </Button>
                </div>

                {/* Skip Option */}
                {!isLastSlide && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground mx-auto h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    <IconPlayerSkipForward className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Skip orientation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
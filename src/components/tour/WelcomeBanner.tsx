import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconRocket, IconX, IconSparkles } from '@tabler/icons-react'
import { Luggage } from 'lucide-react'
import { useOrientationStore } from '@/stores/orientationStore'

interface WelcomeBannerProps {
  onDismiss?: () => void
  className?: string
}

export function WelcomeBanner({ onDismiss, className }: WelcomeBannerProps) {
  const { startOrientation } = useOrientationStore()

  const handleStartOrientation = () => {
    startOrientation()
    onDismiss?.()
  }

  const handleDismiss = () => {
    onDismiss?.()
  }

  return (
    <Card className={`relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <IconRocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                Welcome to Colella Partners! 
                <Badge variant="secondary" className="text-xs">
                  <IconSparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ready to start earning from referrals? Let's get you oriented!
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <IconX className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">What you'll learn:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                How to track your referrals and earnings
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Where to find your referral tools
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                How to manage your profile and settings
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Getting help when you need it
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconSparkles className="h-4 w-4" />
              <span>Takes just 2-3 minutes</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                onClick={handleStartOrientation}
                className="flex-1"
              >
                <Luggage className="h-4 w-4 mr-2" />
                Take a Tour
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Decorative elements */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl"></div>
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-gradient-to-br from-secondary/10 to-primary/10 blur-2xl"></div>
    </Card>
  )
}

export default WelcomeBanner 
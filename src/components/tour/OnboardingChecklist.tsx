import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import { 
  IconCheck, 
  IconChevronDown, 
  IconChevronUp,
  IconUser,
  IconUserPlus,
  IconSettings,
  IconArrowRight,
  IconExternalLink,
  IconPhotoScan
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useOrientationStore } from '@/stores/orientationStore'
import { useAuth } from '@/hooks/useAuth'
import supabase from '@/lib/supabase'

export interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  actionText?: string
  actionLink?: string
  onAction?: () => void
  required?: boolean
}

interface OnboardingChecklistProps {
  className?: string
  isCollapsible?: boolean
}

export function OnboardingChecklist({ className, isCollapsible = true }: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { startOrientation, hasCompletedOrientation } = useOrientationStore()
  const { user } = useAuth()

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.completed).length
  const totalCount = checklistItems.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Check completion status for various tasks
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const checkCompletionStatus = async () => {
      try {
        // Check profile completion
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name, phone_number, birthday, communication_emails, marketing_emails')
          .eq('id', user.id)
          .single()

        const isProfileComplete = profile && 
          !!profile.name?.trim() && 
          !!profile.phone_number?.trim() && 
          !!profile.birthday?.trim()

        const hasSetPreferences = profile &&
          profile.communication_emails !== null &&
          profile.marketing_emails !== null

        // Check if user has made any referrals
        const { data: referrerData } = await supabase
          .from('referrers')
          .select('id')
          .eq('user_id', user.id)
          .single()

                 let hasMadeReferral = false
         if (referrerData) {
           const { data: referrals } = await supabase
             .from('referrals')
             .select('id')
             .eq('referrer_id', referrerData.id)
             .limit(1)

           hasMadeReferral = !!(referrals && referrals.length > 0)
         }

        // Update checklist items
        const items: ChecklistItem[] = [
          {
            id: 'orientation',
            title: 'Take the App Orientation',
            description: 'Learn how to navigate and use all features',
            icon: <IconArrowRight className="h-5 w-5" />,
            completed: hasCompletedOrientation,
            actionText: 'Start Orientation',
            onAction: startOrientation,
            required: true,
          },
          {
            id: 'profile',
            title: 'Complete Your Profile',
            description: 'Add your name, phone number, and birthday',
            icon: <IconUser className="h-5 w-5" />,
            completed: !!isProfileComplete,
            actionText: 'Update Profile',
            actionLink: '/settings/profile',
            required: true,
          },
          {
            id: 'preferences',
            title: 'Set Communication Preferences',
            description: 'Choose how you want to be contacted',
            icon: <IconSettings className="h-5 w-5" />,
            completed: !!hasSetPreferences,
            actionText: 'Set Preferences',
            actionLink: '/settings/communications',
            required: true,
          },
          {
            id: 'first-referral',
            title: 'Make Your First Referral',
            description: 'Refer your first client and start earning',
            icon: <IconUserPlus className="h-5 w-5" />,
            completed: hasMadeReferral,
            actionText: 'Add Referral',
            actionLink: '/referrals/new',
            required: false,
          },
          {
            id: 'create-marketing-material',
            title: 'Create Marketing Material',
            description: 'Design and download professional marketing assets',
            icon: <IconPhotoScan className="h-5 w-5" />,
            completed: false, // This can be tracked later if needed
            actionText: 'View Materials',
            actionLink: '/referral-toolkit?tab=materials',
            required: false,
          },
        ]

        setChecklistItems(items)
      } catch (error) {
        console.error('Error checking completion status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkCompletionStatus()
  }, [user, hasCompletedOrientation, startOrientation])

  const handleItemAction = (item: ChecklistItem) => {
    if (item.onAction) {
      item.onAction()
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const requiredItems = checklistItems.filter(item => item.required)
  const requiredCompleted = requiredItems.filter(item => item.completed).length
  const allRequiredComplete = requiredCompleted === requiredItems.length

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Getting Started
              {allRequiredComplete && (
                <Badge variant="secondary" className="text-xs">
                  <IconCheck className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete these steps to get the most out of your dashboard
            </p>
          </div>
          {isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <IconChevronUp className="h-4 w-4" />
              ) : (
                <IconChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item.completed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                  : 'bg-muted/50 border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  item.completed 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                    : 'bg-background text-muted-foreground'
                }`}>
                  {item.completed ? <IconCheck className="h-4 w-4" /> : item.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium ${
                      item.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {item.title}
                    </h4>
                    {item.required && !item.completed && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {!item.completed && item.actionText && (
                <div>
                  {item.actionLink ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={item.actionLink}>
                        {item.actionText}
                        <IconExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleItemAction(item)}
                    >
                      {item.actionText}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {allRequiredComplete && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-green-600 dark:text-green-400 mb-2">
                <IconCheck className="h-8 w-8 mx-auto" />
              </div>
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Great job! 🎉
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've completed all the essential setup steps. You're ready to start earning!
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default OnboardingChecklist 
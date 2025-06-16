import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import supabase from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Header } from '../../components/layout/header'

import { Badge } from '../../components/ui/badge'
import { IconTrophy, IconUserCircle, IconGift, IconCoin, IconArrowRight, IconUserPlus, IconChartBar, IconCalendarStats } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RewardsActivity } from '../../components/dashboard/RewardsActivity'
import { useAuth } from '../../hooks/useAuth'
import { useProfileCompletion } from '../../hooks/useProfileCompletion'
import { ProfileCompletionDialog } from '../../features/auth/profile-completion/profile-completion-dialog'
import { PartnerReferralForm } from '../../components/referrals/PartnerReferralForm'

import { WelcomeBanner } from '../../components/tour/WelcomeBanner'
import { OnboardingChecklist } from '../../components/tour/OnboardingChecklist'
import { useOrientationStore } from '../../stores/orientationStore'

// Define interfaces for our data
interface Referral {
  id: string
  referrer_id: string
  referee_name: string
  referee_email: string
  referee_phone: string
  referee_type: string
  created_at: string
  status: string
  situation_description?: string
  additional_notes?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  target: number
  progress: number
  icon: string
}

export const Route = createFileRoute('/_authenticated/')({
  component: PartnerDashboard,
})

export { PartnerDashboard };

function PartnerDashboard() {
  const { user } = useAuth()
  const { isDialogOpen, closeDialog, handleProfileCompleted } = useProfileCompletion()
  const { hasSeenOrientation, hasCompletedOrientation } = useOrientationStore()
  // Remove hardcoded ID and replace with state variable for referrer ID
  const [referrerId, setReferrerId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    conversionRate: 0,
  })
  const [latestReferral, setLatestReferral] = useState<Referral | null>(null)
  const [_nextAchievement, ] = useState<Achievement | null>(null)
  const [achievementStats, setAchievementStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    latestAchievement: null as { title: string; completed_date: string; stackIcon: string } | null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasReferrals, setHasReferrals] = useState(false)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  // Fetch referrer ID first
  const fetchReferrerId = useCallback(async () => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        // Only show error if it's not "No rows found" error
        throw error
      }
      
      if (data) {
        setReferrerId(data.id)
        return data.id
      }
      
      return null
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Error fetching referrer profile: ${errorMessage}`)
      return null
    }
  }, [user])

  // Fetch user achievements data
  const fetchAchievements = useCallback(async () => {
    if (!user) return

    try {
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')

      if (achievementsError) throw achievementsError

      // Fetch user achievements with completed ones
      const { data: userAchievementsData, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements:achievement_id (
            title,
            description,
            stack_id,
            achievement_stacks:stack_id (
              icon
            )
          )
        `)
        .eq('user_id', user.id)

      if (userError) throw userError

      const totalAchievements = achievementsData?.length || 0
      const completedUserAchievements = userAchievementsData?.filter(ua => ua.completed) || []
      const completedCount = completedUserAchievements.length

      // Find the most recent completed achievement
      let latestAchievement = null
      if (completedUserAchievements.length > 0) {
        const latest = completedUserAchievements.sort((a, b) => 
          new Date(b.completed_date || '').getTime() - new Date(a.completed_date || '').getTime()
        )[0]
        
        latestAchievement = {
          title: latest.achievements?.title || 'Unknown Achievement',
          completed_date: latest.completed_date || '',
          stackIcon: latest.achievements?.achievement_stacks?.icon || 'trophy'
        }
      }

      setAchievementStats({
        totalAchievements,
        completedAchievements: completedCount,
        latestAchievement
      })

    } catch (_error: unknown) {
      // Silently handle achievement errors as they are secondary to the main dashboard
      // Don't set error state here as achievements are secondary to the main dashboard
    }
  }, [user])

  // Define fetchDashboardData before using it in useEffect
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Get referrer ID first
      const currentReferrerId = referrerId || await fetchReferrerId()
      
      if (!currentReferrerId) {
        // No referrer record found, show empty state
        setHasReferrals(false)
        setLatestReferral(null)
        setStats({
          totalReferrals: 0,
          pendingReferrals: 0,
          completedReferrals: 0,
          conversionRate: 0
        })
        setLoading(false)
        return
      }
      
      // Fetch referrals with the current referrer ID
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', currentReferrerId)
        .order('created_at', { ascending: false })
      
      if (referralsError) {
        throw new Error(`Error fetching referrals: ${referralsError.message}`)
      }
      
      if (referralsData && referralsData.length > 0) {
        const referrals = referralsData as unknown as Referral[]
        setHasReferrals(true)
        
        // Set latest referral
        setLatestReferral(referrals[0])
        
        // Calculate statistics
        const total = referrals.length
        const completed = referrals.filter(ref => 
          ['Signed Up', 'Settled'].includes(ref.status)).length
        const pending = total - completed
        const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0
        
        setStats({
          totalReferrals: total,
          pendingReferrals: pending,
          completedReferrals: completed,
          conversionRate: conversionRate
        })
      } else {
        // No referrals found
        setHasReferrals(false)
        setLatestReferral(null)
        setStats({
          totalReferrals: 0,
          pendingReferrals: 0,
          completedReferrals: 0,
          conversionRate: 0
        })
      }
      
      // Fetch next achievement 
      // In a real app, we would fetch this from the database
      // This is a placeholder that would be replaced with actual data
      /*
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements') // This table name caused the error
        .select('*')
        .eq('user_id', user.id) // Use user.id instead of hardcoded ID
        .order('progress', { ascending: false })
        .limit(1)
      
      if (achievementsError) {
        setError(`Error fetching achievements: ${achievementsError.message}`)
      } else if (achievementsData && achievementsData.length > 0) {
        setNextAchievement(achievementsData[0] as unknown as Achievement)
      }
      */
      
      // Fetch achievements data
      await fetchAchievements()
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`An unexpected error occurred when loading dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false)
    }
  }, [user, referrerId, fetchReferrerId, fetchAchievements])

  // Effect to fetch referrer ID when user changes
  useEffect(() => {
    if (user) {
      fetchReferrerId()
    }
  }, [user, fetchReferrerId])

  // Now use it in useEffect to fetch dashboard data when referrerId changes
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, referrerId, fetchDashboardData])

  // Check if we should show welcome banner for first-time users
  useEffect(() => {
    if (user && !hasSeenOrientation && !hasCompletedOrientation) {
      setShowWelcomeBanner(true)
    }
  }, [user, hasSeenOrientation, hasCompletedOrientation])



  const getStatusBadgeClass = (status: string) => {
    const statusLower = status?.toLowerCase() || ''
    
    if (statusLower === 'new') return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    if (statusLower === 'contacted') return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    if (statusLower === 'signed up' || statusLower === 'settled') return 'bg-green-100 text-green-800 hover:bg-green-200'
    if (statusLower === 'ineligible') return 'bg-red-100 text-red-800 hover:bg-red-200'
    if (statusLower === 'appraised' || statusLower === 'listed' || statusLower === 'sold') return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
    
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getIconForAchievement = (icon: string) => {
    switch (icon) {
      case 'user':
        return <IconUserCircle className="h-8 w-8 text-primary" />
      case 'userCheck':
        return <IconUserCircle className="h-8 w-8 text-primary" />
      case 'gift':
        return <IconGift className="h-8 w-8 text-primary" />
      case 'coin':
        return <IconCoin className="h-8 w-8 text-primary" />
      case 'medal':
        return <IconTrophy className="h-8 w-8 text-primary" />
      case 'award':
        return <IconTrophy className="h-8 w-8 text-primary" />
      case 'calendar':
        return <IconTrophy className="h-8 w-8 text-primary" />
      default:
        return <IconTrophy className="h-8 w-8 text-primary" />
    }
  }

  const EmptyDashboardState = () => (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <img 
          src="/images/empty-folder.png" 
          alt="Empty folder" 
          className="mb-4 opacity-70 w-16 h-16"
        />
        <h3 className="text-lg md:text-xl font-semibold mb-2">No referrals yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          When you make a referral, you'll be able to track everything here, 
          including statistics, rewards, and progress toward achievements.
        </p>
        <PartnerReferralForm />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="container py-6">
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-xl font-medium mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>Retry</Button>
            </div>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard" />
      
      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog 
        open={isDialogOpen} 
        onOpenChange={closeDialog}
        onComplete={handleProfileCompleted}
      />
      
      <div className="container py-6">
        {/* Welcome Banner for first-time users */}
        {showWelcomeBanner && (
          <div className="mb-6">
            <WelcomeBanner onDismiss={() => setShowWelcomeBanner(false)} />
          </div>
        )}



        {/* Onboarding Checklist */}
        {(!hasCompletedOrientation || !hasSeenOrientation) && (
          <div className="mb-6">
            <OnboardingChecklist />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12"></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12"></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-12"></div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col min-h-[280px] md:min-h-[320px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Loading...</CardTitle>
                    <CardDescription className="text-sm">Loading data...</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3">
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : hasReferrals ? (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {/* Total Referrals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    Total Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <IconUserPlus className="mr-3 h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                      <p className="text-xs text-muted-foreground">All time referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Completed Referrals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Completed Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <IconChartBar className="mr-3 h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold">{stats.completedReferrals}</div>
                      <p className="text-xs text-muted-foreground">
                        {`${stats.conversionRate}% conversion rate`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pending Referrals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Pending Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <IconCalendarStats className="mr-3 h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
                      <p className="text-xs text-muted-foreground">Awaiting completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {/* Latest Referral */}
              <Card className="flex flex-col min-h-[280px] md:min-h-[320px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Latest Referral
                  </CardTitle>
                  <CardDescription className="text-sm">Your most recent client referral</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {latestReferral ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate">{latestReferral.referee_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{latestReferral.referee_email}</p>
                        </div>
                        <Badge className={getStatusBadgeClass(latestReferral.status)}>
                          {latestReferral.status}
                        </Badge>
                      </div>
                      {latestReferral.situation_description && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Situation</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">{latestReferral.situation_description}</p>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pt-1">
                        Referred on {formatDate(latestReferral.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground">No referrals found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/referrals">
                      View All Referrals
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Rewards Activity */}
              <Card className="flex flex-col min-h-[280px] md:min-h-[320px]">
                <RewardsActivity userId={referrerId || undefined} noCard={true} />
              </Card>
              
              {/* Achievements Overview */}
              <Card className="flex flex-col min-h-[280px] md:min-h-[320px] md:col-span-2 xl:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Achievements</CardTitle>
                  <CardDescription className="text-sm">Your achievement progress and latest milestone</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center mb-4">
                    <IconTrophy className="mr-3 h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold">{achievementStats.completedAchievements}</div>
                      <p className="text-xs text-muted-foreground">
                        of {achievementStats.totalAchievements} achievements completed
                      </p>
                    </div>
                  </div>
                  {achievementStats.latestAchievement ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Latest Achievement</h4>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getIconForAchievement(achievementStats.latestAchievement.stackIcon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-2">{achievementStats.latestAchievement.title}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed on {formatDate(achievementStats.latestAchievement.completed_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Get Started</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete your first referral to unlock achievements!
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/achievements">
                      View All Achievements
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        ) : (
          <div className="grid gap-6">
            <EmptyDashboardState />
          </div>
        )}
      </div>


    </>
  )
}

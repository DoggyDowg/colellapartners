import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import supabase from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Header } from '../../components/layout/header'
import { Progress } from '@/components/ui/progress'
import { Badge } from '../../components/ui/badge'
import { IconTrophy, IconUserCircle, IconGift, IconArrowRight, IconUserPlus, IconChartBar, IconCalendarStats } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RewardsActivity } from '../../components/dashboard/RewardsActivity'
import { useAuth } from '../../hooks/useAuth'
import { PartnerReferralForm } from '../../components/referrals/PartnerReferralForm'

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
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    conversionRate: 0,
  })
  const [latestReferral, setLatestReferral] = useState<Referral | null>(null)
  const [nextAchievement, ] = useState<Achievement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasReferrals, setHasReferrals] = useState(false)

  // Define fetchDashboardData before using it in useEffect
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use authenticated user's ID instead of hardcoded ID
      const userId = user.id
      
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
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
        .eq('user_id', userId)
        .order('progress', { ascending: false })
        .limit(1)
      
      if (achievementsError) {
        setError(`Error fetching achievements: ${achievementsError.message}`)
      } else if (achievementsData && achievementsData.length > 0) {
        setNextAchievement(achievementsData[0] as unknown as Achievement)
      }
      */
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`An unexpected error occurred when loading dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false)
    }
  }, [user])

  // Now use it in useEffect
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

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
      case 'gift':
        return <IconGift className="h-8 w-8 text-primary" />
      default:
        return <IconTrophy className="h-8 w-8 text-primary" />
    }
  }

  const EmptyDashboardState = () => (
    <Card className="col-span-3">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <img 
          src="/images/empty-folder.png" 
          alt="Empty folder" 
          className="mb-4 opacity-70 w-16 h-16"
        />
        <h3 className="text-xl font-semibold mb-2">No referrals yet</h3>
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
      
      <div className="container py-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
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
        ) : hasReferrals ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {/* Total Referrals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Total Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <IconUserPlus className="mr-2 h-8 w-8 text-muted-foreground" />
                    <div>
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
                    <IconChartBar className="mr-2 h-8 w-8 text-muted-foreground" />
                    <div>
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
                    <IconCalendarStats className="mr-2 h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
                      <p className="text-xs text-muted-foreground">Awaiting completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Latest Referral */}
              <Card className="col-span-2 md:col-span-1 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Latest Referral</CardTitle>
                  <CardDescription>Your most recent client referral</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestReferral ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{latestReferral.referee_name}</h3>
                          <p className="text-sm text-muted-foreground">{latestReferral.referee_email}</p>
                        </div>
                        <Badge className={getStatusBadgeClass(latestReferral.status)}>
                          {latestReferral.status}
                        </Badge>
                      </div>
                      {latestReferral.situation_description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Situation</h4>
                          <p className="text-sm text-muted-foreground">{latestReferral.situation_description}</p>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Referred on {formatDate(latestReferral.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 flex items-center justify-center">
                      <p>No referrals found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/referrals">
                      View All Referrals
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Rewards Activity */}
              <Card className="col-span-2 md:col-span-1 lg:col-span-1">
                <RewardsActivity userId={user?.id} />
              </Card>
              
              {/* Next Achievement */}
              <Card className="col-span-2 md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Next Achievement</CardTitle>
                  <CardDescription>Your progress towards the next milestone</CardDescription>
                </CardHeader>
                <CardContent>
                  {nextAchievement ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        {getIconForAchievement(nextAchievement.icon)}
                        <div>
                          <h3 className="font-semibold">{nextAchievement.title}</h3>
                          <p className="text-sm text-muted-foreground">{nextAchievement.description}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{nextAchievement.progress} / {nextAchievement.target}</span>
                        </div>
                        <Progress value={(nextAchievement.progress / nextAchievement.target) * 100} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[104px] flex items-center justify-center">
                      <p>No achievements found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
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
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <EmptyDashboardState />
          </div>
        )}
      </div>
    </>
  )
}

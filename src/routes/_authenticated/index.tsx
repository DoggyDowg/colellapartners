import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Header } from '../../components/layout/header'
import { ThemeSwitch } from '../../components/theme-switch'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Progress } from '@/components/ui/progress'
import { Badge } from '../../components/ui/badge'
import { IconTrophy, IconUserCircle, IconGift, IconArrowRight, IconUserPlus, IconChartBar, IconCalendarStats } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { PropertyOverview } from '../../components/dashboard/PropertyOverview'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RewardsActivity } from '../../components/dashboard/RewardsActivity'

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
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    conversionRate: 0,
  })
  const [latestReferral, setLatestReferral] = useState<Referral | null>(null)
  const [nextAchievement, setNextAchievement] = useState<Achievement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Hardcoded user ID for demo - replace with actual user auth in production
      const hardcodedId = '7e4b6261-8037-4136-8119-2944dc9453ff'
      
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', hardcodedId)
        .order('created_at', { ascending: false })
      
      if (referralsError) {
        throw new Error(`Error fetching referrals: ${referralsError.message}`)
      }
      
      if (referralsData && referralsData.length > 0) {
        const referrals = referralsData as unknown as Referral[]
        
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
      }
      
      // For demo purposes, create a mock next achievement
      // In production, this would be fetched from the database
      setNextAchievement({
        id: '2',
        title: 'Referral Master',
        description: 'Submit 5 referrals',
        target: 5,
        progress: 3,
        icon: 'user'
      })
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('An unexpected error occurred when loading dashboard data.')
    } finally {
      setLoading(false)
    }
  }

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

  if (error) {
    return (
      <>
        <Header title="Dashboard">
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
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
      <Header title="Dashboard">
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      
      <div className="container py-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

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
                  <div className="text-2xl font-bold">{loading ? '...' : stats.totalReferrals}</div>
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
                  <div className="text-2xl font-bold">{loading ? '...' : stats.completedReferrals}</div>
                  <p className="text-xs text-muted-foreground">
                    {loading ? '' : `${stats.conversionRate}% conversion rate`}
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
                  <div className="text-2xl font-bold">{loading ? '...' : stats.pendingReferrals}</div>
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
              {loading ? (
                <div className="h-36 flex items-center justify-center">
                  <p>Loading latest referral...</p>
                </div>
              ) : latestReferral ? (
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
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <p className="text-sm text-muted-foreground">{latestReferral.referee_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Date Submitted</p>
                      <p className="text-sm text-muted-foreground">{formatDate(latestReferral.created_at)}</p>
                    </div>
                    {latestReferral.situation_description && (
                      <div className="col-span-2 mt-2">
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground">{latestReferral.situation_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center">
                  <p className="text-muted-foreground">No referrals found. Make your first referral today!</p>
                </div>
              )}
            </CardContent>
            {latestReferral && (
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/referrals">
                    View All Referrals
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Rewards Activity */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <RewardsActivity />
          </div>
          
          {/* Next Achievement */}
          <Card className="col-span-2 md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Next Achievement</CardTitle>
              <CardDescription>Your progress towards the next milestone</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-36 flex items-center justify-center">
                  <p>Loading achievement...</p>
                </div>
              ) : nextAchievement ? (
                <div className="flex flex-col items-center">
                  <div className="mb-4 p-3 bg-primary/10 rounded-full">
                    {getIconForAchievement(nextAchievement.icon)}
                  </div>
                  <h3 className="font-semibold text-center text-lg mb-1">{nextAchievement.title}</h3>
                  <p className="text-sm text-center text-muted-foreground mb-4">{nextAchievement.description}</p>
                  <div className="w-full mb-2">
                    <Progress 
                      value={(nextAchievement.progress / nextAchievement.target) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <p className="text-sm font-medium">
                    {nextAchievement.progress} of {nextAchievement.target} completed
                  </p>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-center">
                  <p className="text-muted-foreground">Great job! You've completed all achievements!</p>
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

          {/* Featured Properties */}
          <Card className="col-span-2 md:col-span-2 lg:col-span-1">
            <PropertyOverview />
          </Card>
        </div>
      </div>
    </>
  )
}

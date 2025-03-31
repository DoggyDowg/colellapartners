import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

// Define interfaces for our data
interface Referrer {
  full_name: string
  email: string
}

interface Referral {
  id: string
  referrer_id: string
  referee_name: string
  referee_email: string
  referee_type: string
  created_at: string
  status: string
  referrers: Referrer
}

export const Route = createFileRoute('/admin/_index')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalReferrers: 0,
    pendingRewards: 0,
    completedReferrals: 0,
  })
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      try {
        // Fetch total referrals
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact' })

        // Fetch total referrers
        const { data: referrersData, error: referrersError } = await supabase
          .from('referrers')
          .select('*', { count: 'exact' })

        // Fetch completed referrals
        const { data: completedData, error: completedError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact' })
          .eq('status', 'completed')

        // Fetch pending rewards
        const { data: pendingRewardsData, error: pendingRewardsError } =
          await supabase
            .from('rewards')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')

        // Fetch recent referrals
        const { data: recentData, error: recentError } = await supabase
          .from('referrals')
          .select(
            `
            id,
            referrer_id,
            referee_name,
            referee_email,
            referee_type,
            created_at,
            status,
            referrers (
              full_name,
              email
            )
          `,
          )
          .order('created_at', { ascending: false })
          .limit(5)

        if (
          referralsError ||
          referrersError ||
          completedError ||
          pendingRewardsError ||
          recentError
        ) {
          console.error('Error fetching dashboard data')
        } else {
          setStats({
            totalReferrals: referralsData?.length || 0,
            totalReferrers: referrersData?.length || 0,
            completedReferrals: completedData?.length || 0,
            pendingRewards: pendingRewardsData?.length || 0,
          })
          if (recentData) {
            setRecentReferrals(recentData as unknown as Referral[])
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalReferrals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalReferrers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.completedReferrals}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.pendingRewards}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
                <CardDescription>
                  The latest referrals in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentReferrals.length === 0 ? (
                  <p className="text-muted-foreground">No referrals yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentReferrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex justify-between items-start border-b pb-3"
                      >
                        <div>
                          <p className="font-medium">{referral.referee_name}</p>
                          <p className="text-sm text-muted-foreground">
                            By: {referral.referrers?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs ${
                              referral.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : referral.status === 'disqualified'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {referral.status || 'new'}
                          </span>
                          <p className="text-xs text-right mt-1">
                            {referral.referee_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <a
                    href="/admin/referrals"
                    className="text-sm text-primary hover:underline"
                  >
                    View all referrals →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
                <CardDescription>
                  Quick summary of the referral program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Seller Reward
                      </p>
                      <p className="text-xl font-bold">$500</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Landlord Reward
                      </p>
                      <p className="text-xl font-bold">$200</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Conversion Rate
                      </p>
                      <p className="text-xl font-bold">
                        {stats.totalReferrals > 0
                          ? `${Math.round((stats.completedReferrals / stats.totalReferrals) * 100)}%`
                          : '0%'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Period
                      </p>
                      <p className="text-xl font-bold">6 months</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Upcoming Enhancements</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Partner portal launch</li>
                      <li>• Automated email workflows</li>
                      <li>• Monthly raffle system</li>
                      <li>• Partner events</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard

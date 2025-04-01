import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

// Dashboard component with all the metrics and features
function AdminDashboard() {
  console.log('Full AdminDashboard component rendering');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalReferrers, setTotalReferrers] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [completedReferrals, setCompletedReferrals] = useState(0);
  const [totalRewardsAmount, setTotalRewardsAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Basic metrics - just getting counts
        const { count: referralsCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true });
        
        setTotalReferrals(referralsCount || 0);
        
        const { count: referrersCount } = await supabase
          .from('referrers')
          .select('*', { count: 'exact', head: true });
        
        setTotalReferrers(referrersCount || 0);
        
        const { count: completedCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        setCompletedReferrals(completedCount || 0);
        
        const { count: pendingCount } = await supabase
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        setPendingRewards(pendingCount || 0);
        
        // Calculate total rewards amount
        const { data: allRewards } = await supabase
          .from('rewards')
          .select('amount')
          .eq('status', 'paid');
        
        if (allRewards) {
          const total = allRewards.reduce((sum, reward) => sum + (reward.amount || 0), 0);
          setTotalRewardsAmount(total);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h2 className="text-xl font-medium mb-2">Dashboard Data Error</h2>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time referrals received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalReferrers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active referral partners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully converted referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingRewards}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rewards awaiting distribution
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Total Rewards Paid</CardTitle>
              <CardDescription>Total amount of rewards distributed to partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(totalRewardsAmount)}</div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
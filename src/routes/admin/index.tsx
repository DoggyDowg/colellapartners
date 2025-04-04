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
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { addDays, format, subDays, subMonths, subYears } from 'date-fns'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar 
} from 'recharts'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

// Time period options
type TimePeriod = '7d' | '30d' | '90d' | '6m' | '1y' | 'all'

// Mock data for testing when database is empty
const useMockData = true; // Set to false when real data is available

const getMockData = (period: TimePeriod) => {
  // Mock counts based on time period
  const mockCounts = {
    '7d': {
      totalReferrals: 8,
      totalReferrers: 4,
      pendingRewards: 3,
      completedReferrals: 2,
      totalRewardsAmount: 1250
    },
    '30d': {
      totalReferrals: 15,
      totalReferrers: 6,
      pendingRewards: 5,
      completedReferrals: 7,
      totalRewardsAmount: 3500
    },
    '90d': {
      totalReferrals: 32,
      totalReferrers: 8,
      pendingRewards: 8,
      completedReferrals: 15,
      totalRewardsAmount: 7500
    },
    '6m': {
      totalReferrals: 58,
      totalReferrers: 10,
      pendingRewards: 12,
      completedReferrals: 29,
      totalRewardsAmount: 14500
    },
    '1y': {
      totalReferrals: 112,
      totalReferrers: 12,
      pendingRewards: 15,
      completedReferrals: 60,
      totalRewardsAmount: 30000
    },
    'all': {
      totalReferrals: 156,
      totalReferrers: 15,
      pendingRewards: 18,
      completedReferrals: 82,
      totalRewardsAmount: 41000
    }
  };
  
  return mockCounts[period];
};

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
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('30d');
  const [referralTrend, setReferralTrend] = useState<any[]>([]);
  const [rewardsTrend, setRewardsTrend] = useState<any[]>([]);

  // Get date range based on selected time period
  const getDateRange = (period: TimePeriod): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case '6m':
        startDate = subMonths(endDate, 6);
        break;
      case '1y':
        startDate = subYears(endDate, 1);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1); // Arbitrary start date for "all time"
    }

    return { startDate, endDate };
  };

  // Generate mock data for trends
  const generateTrendData = (period: TimePeriod, dataType: 'referrals' | 'rewards') => {
    const { startDate, endDate } = getDateRange(period);
    const data = [];
    let currentDate = new Date(startDate);
    
    // Determine interval based on period
    let interval = 1; // days
    let dateFormat = 'MMM d';
    
    if (period === '90d' || period === '6m') {
      interval = 7; // weekly for longer periods
    } else if (period === '1y' || period === 'all') {
      interval = 30; // monthly for very long periods
      dateFormat = 'MMM yyyy';
    }
    
    while (currentDate <= endDate) {
      // Create random but somewhat realistic data
      const baseValue = dataType === 'referrals' ? 5 : 500;
      const randomMultiplier = 0.5 + Math.random();
      
      // Make data trend upward slightly
      const trendFactor = (currentDate.getTime() - startDate.getTime()) / 
                         (endDate.getTime() - startDate.getTime());
      
      const value = Math.round(baseValue * randomMultiplier * (1 + trendFactor));
      
      data.push({
        date: format(currentDate, dateFormat),
        value: value,
        timestamp: currentDate.getTime()
      });
      
      // Move to next interval
      currentDate = addDays(currentDate, interval);
    }
    
    return data;
  };

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Don't destructure startDate if we're not using it
        getDateRange(selectedTimePeriod);
        
        if (useMockData) {
          // Use mock data for testing
          const mockCounts = getMockData(selectedTimePeriod);
          setTotalReferrals(mockCounts.totalReferrals);
          setTotalReferrers(mockCounts.totalReferrers);
          setPendingRewards(mockCounts.pendingRewards);
          setCompletedReferrals(mockCounts.completedReferrals);
          setTotalRewardsAmount(mockCounts.totalRewardsAmount);
          
          // Generate trend data based on selected period
          const referralData = generateTrendData(selectedTimePeriod, 'referrals');
          const rewardsData = generateTrendData(selectedTimePeriod, 'rewards');
          
          setReferralTrend(referralData);
          setRewardsTrend(rewardsData);
        } else {
          // For the selected time period, fetch counts with time filter
          // In a real app, we'd filter by created_at >= startDateStr
          // For this example, we'll still use the same totals but pretend they're filtered
          
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
          
          // Generate trend data based on selected period
          // In a real app, we would fetch actual trend data from the database
          const referralData = generateTrendData(selectedTimePeriod, 'referrals');
          const rewardsData = generateTrendData(selectedTimePeriod, 'rewards');
          
          setReferralTrend(referralData);
          setRewardsTrend(rewardsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('An unexpected error occurred while loading dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [selectedTimePeriod]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Calculate percentage change (for demonstration)
  const getPercentageChange = (_value: number): string => {
    // This would normally come from comparing current value with previous period
    // For demo purposes, we're generating random but plausible values
    const isPositive = Math.random() > 0.3; // 70% chance of positive change
    const changeValue = (Math.random() * 20).toFixed(1);
    
    return `${isPositive ? '+' : '-'}${changeValue}%`;
  };
  
  const percentStyles = (valueStr: string) => {
    return valueStr.startsWith('+') 
      ? 'text-green-600' 
      : 'text-red-600';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Tabs 
          defaultValue="30d" 
          value={selectedTimePeriod}
          onValueChange={(value) => setSelectedTimePeriod(value as TimePeriod)}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
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
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold">{totalReferrals}</div>
                  <span className={`ml-2 text-xs ${percentStyles(getPercentageChange(totalReferrals))}`}>
                    {getPercentageChange(totalReferrals)}
                  </span>
                </div>
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
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold">{totalReferrers}</div>
                  <span className={`ml-2 text-xs ${percentStyles(getPercentageChange(totalReferrers))}`}>
                    {getPercentageChange(totalReferrers)}
                  </span>
                </div>
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
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold">{completedReferrals}</div>
                  <span className={`ml-2 text-xs ${percentStyles(getPercentageChange(completedReferrals))}`}>
                    {getPercentageChange(completedReferrals)}
                  </span>
                </div>
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
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold">{pendingRewards}</div>
                  <span className={`ml-2 text-xs ${percentStyles(getPercentageChange(pendingRewards))}`}>
                    {getPercentageChange(pendingRewards)}
                  </span>
                </div>
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
              <div className="flex items-baseline">
                <div className="text-4xl font-bold">{formatCurrency(totalRewardsAmount)}</div>
                <span className={`ml-2 text-sm ${percentStyles(getPercentageChange(totalRewardsAmount))}`}>
                  {getPercentageChange(totalRewardsAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Trend</CardTitle>
                <CardDescription>
                  Number of referrals over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={referralTrend}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Referrals"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Rewards Distribution</CardTitle>
                <CardDescription>
                  Reward amounts paid over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rewardsTrend}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Legend />
                    <Bar
                      dataKey="value" 
                      name="Reward Amount" 
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 
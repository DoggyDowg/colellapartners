import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
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
  CartesianGrid, 
  BarChart,
  Bar 
} from 'recharts'
import { AdminCheck } from '../../components/admin/AdminCheck'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Spinner } from '../../components/ui/spinner'
import { Ticket, Users, Gift } from 'lucide-react'

// Import our app CSS to ensure the spinner animations are loaded
import '../../app.css'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

// Time period options
type TimePeriod = '7d' | '30d' | '90d' | '6m' | '1y' | 'all'

// Set this to false to ensure we're using real data
const useMockData = false;

// Referral types for filtering
type ReferralType = 'all' | 'seller' | 'landlord'

// Mock data for testing when database is empty
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
  const [activeReferralType, setActiveReferralType] = useState<ReferralType>('all');
  const [activeRewardStatus, setActiveRewardStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [pendingRewardsAmount, setPendingRewardsAmount] = useState(0);
  const [paidRewardsAmount, setPaidRewardsAmount] = useState(0);
  const [totalReferralsByType, setTotalReferralsByType] = useState<Record<ReferralType, number>>({
    all: 0,
    seller: 0,
    landlord: 0
  });

  // Chart configs for the different charts
  const referralChartConfig = {
    referrals: {
      label: "Referrals",
      color: "hsl(var(--chart-1))",
    }
  };

  const rewardsChartConfig = {
    rewards: {
      label: "Reward Amount",
      color: "hsl(var(--chart-2))",
    }
  };

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

  // Get date format based on time period
  const getDateFormat = (period: TimePeriod): string => {
    switch (period) {
      case '7d':
      case '30d':
        return 'MMM d';
      case '90d':
      case '6m':
        return 'MMM d';
      case '1y':
      case 'all':
        return 'MMM yyyy';
      default:
        return 'MMM d';
    }
  };

  // Formatter for date ticks based on time period
  const formatDateTick = (date: string, period: TimePeriod): string => {
    // Always show both month and date for clarity
    if (period === '7d' || period === '30d' || period === '90d') {
      const parts = date.split(' ');
      if (parts.length === 2) {
        // Format is "MMM d" - return as is
        return date;
      }
    }
    
    // For 6m, 1y, all, keep the format as is
    return date;
  };

  // Process raw rewards data into chart-friendly format
  const processRewardsData = (rewardsData: any[], period: TimePeriod) => {
    const { startDate, endDate } = getDateRange(period);
    
    // Create date format based on period
    const dateFormat = getDateFormat(period);
    
    // Group by date and status
    const groupedData: Record<string, {
      pending: number;
      paid: number;
      all: number;
      timestamp: number;
    }> = {};
    
    // Initialize data points based on selected time period
    let currentDate = new Date(startDate);
    let interval = 1; // days
    
    if (period === '90d' || period === '6m') {
      interval = 7; // weekly for longer periods
    } else if (period === '1y' || period === 'all') {
      interval = 30; // monthly for very long periods
    }
    
    while (currentDate <= endDate) {
      const formattedDate = format(currentDate, dateFormat);
      groupedData[formattedDate] = {
        pending: 0,
        paid: 0,
        all: 0,
        timestamp: currentDate.getTime()
      };
      currentDate = addDays(currentDate, interval);
    }
    
    // Add actual data to appropriate buckets
    rewardsData.forEach(reward => {
      const rewardDate = new Date(reward.created_at);
      const formattedDate = format(rewardDate, dateFormat);
      
      // If date bucket exists, add to it
      if (groupedData[formattedDate]) {
        const status = reward.status === 'paid' ? 'paid' : 'pending';
        groupedData[formattedDate][status] += Number(reward.amount) || 0;
        groupedData[formattedDate].all += Number(reward.amount) || 0;
      }
    });
    
    // Convert to array sorted by timestamp
    return Object.entries(groupedData)
      .map(([date, data]) => ({ 
        date,
        value: data.all,
        pending: data.pending,
        paid: data.paid,
        timestamp: data.timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };
  
  // For the referral chart to match the rewards chart time intervals
  const generateTrendData = (period: TimePeriod, dataType: 'referrals' | 'rewards') => {
    const { startDate, endDate } = getDateRange(period);
    const data = [];
    let currentDate = new Date(startDate);
    
    // Determine interval based on period
    let interval = 1; // days
    const dateFormat = getDateFormat(period);
    
    if (period === '90d' || period === '6m') {
      interval = 7; // weekly for longer periods
    } else if (period === '1y' || period === 'all') {
      interval = 30; // monthly for very long periods
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

  // Process raw referrals data into chart-friendly format
  const processReferralsData = (referralsData: any[], period: TimePeriod) => {
    const { startDate, endDate } = getDateRange(period);
    
    // Create date format based on period
    const dateFormat = getDateFormat(period);
    
    // Group by date and type
    const groupedData: Record<string, {
      seller: number;
      landlord: number;
      all: number;
      timestamp: number;
    }> = {};
    
    // Initialize data points based on selected time period
    let currentDate = new Date(startDate);
    let interval = 1; // days
    
    if (period === '90d' || period === '6m') {
      interval = 7; // weekly for longer periods
    } else if (period === '1y' || period === 'all') {
      interval = 30; // monthly for very long periods
    }
    
    while (currentDate <= endDate) {
      const formattedDate = format(currentDate, dateFormat);
      groupedData[formattedDate] = {
        seller: 0,
        landlord: 0,
        all: 0,
        timestamp: currentDate.getTime()
      };
      currentDate = addDays(currentDate, interval);
    }
    
    // Add actual data to appropriate buckets
    referralsData.forEach(referral => {
      const referralDate = new Date(referral.created_at);
      const formattedDate = format(referralDate, dateFormat);
      
      // If date bucket exists, add to it
      if (groupedData[formattedDate]) {
        const referralType = referral.referee_type || 'seller';
        
        // Increment the specific type count
        if (referralType in groupedData[formattedDate]) {
          groupedData[formattedDate][referralType as 'seller' | 'landlord'] += 1;
        }
        
        // Always increment the total count
        groupedData[formattedDate].all += 1;
      }
    });
    
    // Convert to array sorted by timestamp
    return Object.entries(groupedData)
      .map(([date, data]) => ({ 
        date,
        value: data.all,
        seller: data.seller,
        landlord: data.landlord,
        timestamp: data.timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { startDate } = getDateRange(selectedTimePeriod);
        
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
          // Basic metrics - just getting counts
          const { count: referralsCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString());
          
          setTotalReferrals(referralsCount || 0);
          
          // Initialize totalReferralsByType with the total count
          setTotalReferralsByType(prev => ({
            ...prev,
            all: referralsCount || 0
          }));
          
          const { count: referrersCount } = await supabase
            .from('referrers')
            .select('*', { count: 'exact', head: true });
          
          setTotalReferrers(referrersCount || 0);
          
          const { count: completedCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');
          
          setCompletedReferrals(completedCount || 0);
          
          // Calculate pending rewards amount and count
          const { data: pendingRewardsData } = await supabase
            .from('rewards')
            .select('amount')
            .eq('status', 'pending');
          
          setPendingRewards(pendingRewardsData?.length || 0);
          
          // Calculate paid rewards amount
          const { data: paidRewardsData } = await supabase
            .from('rewards')
            .select('amount')
            .eq('status', 'paid');
          
          // Calculate total rewards amount (pending + paid)
          const pendingAmount = pendingRewardsData?.reduce((sum, reward) => sum + parseFloat(reward.amount), 0) || 0;
          const paidAmount = paidRewardsData?.reduce((sum, reward) => sum + parseFloat(reward.amount), 0) || 0;
          
          setPendingRewardsAmount(pendingAmount);
          setPaidRewardsAmount(paidAmount);
          setTotalRewardsAmount(pendingAmount + paidAmount);
          
          // Fetch actual referral data from database
          try {
            const { data: referralsData, error: referralsError } = await supabase
              .from('referrals')
              .select('created_at, referee_type, status')
              .gte('created_at', startDate.toISOString());
              
            if (referralsError) throw referralsError;
            
            if (referralsData && referralsData.length > 0) {
              // Process into chart format with proper date aggregation
              const chartData = processReferralsData(referralsData, selectedTimePeriod);
              setReferralTrend(chartData);
              
              // Calculate the types for the selector buttons
              const sellerCount = referralsData.filter(r => r.referee_type === 'seller').length;
              const landlordCount = referralsData.filter(r => r.referee_type === 'landlord').length;
              
              // Update the totalReferralsByType with actual counts
              setTotalReferrals(referralsData.length);
              setTotalReferralsByType({
                all: referralsData.length,
                seller: sellerCount,
                landlord: landlordCount
              });
            } else {
              setReferralTrend([]);
            }
          } catch (referralsError) {
            console.error('Error fetching referrals data:', referralsError);
            setReferralTrend([]);
          }
          
          // Fetch actual rewards data from database
          try {
            const { data: rewardsData, error } = await supabase
              .from('rewards')
              .select('created_at, amount, status')
              .gte('created_at', startDate.toISOString());
              
            if (error) throw error;
            
            if (rewardsData && rewardsData.length > 0) {
              // Process into chart format with proper date aggregation
              const chartData = processRewardsData(rewardsData, selectedTimePeriod);
              setRewardsTrend(chartData);
            } else {
              setRewardsTrend([]);
            }
          } catch (rewardsError) {
            console.error('Error fetching rewards data:', rewardsError);
            setRewardsTrend([]);
          }
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

  // Get filtered referral data based on selected type
  const getFilteredReferralData = () => {
    if (referralTrend.length === 0) {
      return [];
    }

    if (activeReferralType === 'all') {
      return referralTrend;
    }

    // Use the actual data for the selected type
    return referralTrend.map(item => ({
      ...item,
      value: item[activeReferralType] || 0
    }));
  };

  // Get filtered rewards data based on selected status
  const getFilteredRewardsData = () => {
    if (rewardsTrend.length === 0) {
      return [];
    }
    
    if (activeRewardStatus === 'all') {
      return rewardsTrend;
    }
    
    // Use the actual data for the selected status
    return rewardsTrend.map(item => ({
      ...item,
      value: item[activeRewardStatus] || 0
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Calculate total rewards by status
  const totalRewardsByStatus = React.useMemo(() => {
    return {
      all: totalRewardsAmount,
      pending: pendingRewardsAmount,
      paid: paidRewardsAmount,
    };
  }, [totalRewardsAmount, pendingRewardsAmount, paidRewardsAmount]);

  // Format currency without decimal places
  const formatCurrencyNoDecimals = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <AdminCheck />
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
          <Card className="h-96">
            <div className="flex justify-center items-center h-full">
              <Spinner size="large" text="Loading dashboard data..." />
            </div>
          </Card>
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Referrals Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex flex-row items-center gap-2">
                    Total Referrals
                    <Ticket className="h-4 w-4 text-muted-foreground ml-1" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">{totalReferrals}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time referrals received
                  </p>
                </CardContent>
              </Card>
              
              {/* Total Partners Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex flex-row items-center gap-2">
                    Total Partners
                    <Users className="h-4 w-4 text-muted-foreground ml-1" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">{totalReferrers}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active referral partners
                  </p>
                </CardContent>
              </Card>
              
              {/* Completed Referrals Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex flex-row items-center gap-2">
                    Completed Referrals
                    <Ticket className="h-4 w-4 text-muted-foreground ml-1" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">{completedReferrals}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully converted referrals
                  </p>
                </CardContent>
              </Card>
              
              {/* Pending Rewards Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex flex-row items-center gap-2">
                    Pending Rewards
                    <Gift className="h-4 w-4 text-muted-foreground ml-1" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">{pendingRewards}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rewards awaiting distribution
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Total Rewards Paid Card */}
            <Card className="mt-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Total Rewards Paid
                  </CardTitle>
                  <CardDescription>
                    Total amount of rewards distributed to partners
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-4xl font-bold">{formatCurrency(totalRewardsAmount)}</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Charts Section - Full Width */}
            <div className="space-y-6 mt-6">
              {/* Referral Trend Chart */}
              <Card className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 sm:flex-1">
                    <CardTitle>Referral Trend</CardTitle>
                    <CardDescription>
                      Number of referrals over time
                    </CardDescription>
                  </div>
                  <div className="flex sm:border-l sm:min-w-[320px]">
                    {(['all', 'seller', 'landlord'] as const).map((type) => (
                      <button
                        key={type}
                        data-active={activeReferralType === type}
                        className="flex-1 min-w-[80px] flex flex-col items-start justify-center gap-1 px-4 py-3 h-full text-left border-l first:border-l-0 border-t sm:border-t-0 sm:first:border-l data-[active=true]:bg-muted/50"
                        onClick={() => setActiveReferralType(type)}
                      >
                        <span className="text-xs text-muted-foreground capitalize">
                          {type === 'all' ? 'All' : type}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {totalReferralsByType[type]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-80 border-t">
                  {referralTrend.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <p className="text-muted-foreground mb-2">No referral data available for this period</p>
                      <p className="text-xs text-muted-foreground max-w-md">This chart only displays actual referral data. Select a different time period or check back later when new referrals are added.</p>
                    </div>
                  ) : (
                    <ChartContainer
                      className="h-full aspect-auto p-4"
                      config={referralChartConfig}
                    >
                      <LineChart 
                        data={getFilteredReferralData()}
                        margin={{ left: 20, right: 20, top: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={55}
                          tickFormatter={(value) => formatDateTick(value, selectedTimePeriod)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="referrals"
                          stroke="var(--color-referrals)"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            
                            const data = payload[0];
                            const value = data.value;
                            // Use the timestamp to format the date properly
                            const date = new Date(data.payload.timestamp);
                            const formattedDate = format(date, 'MMM dd, yyyy');
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="font-medium">{formattedDate}</div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: "var(--color-referrals)" }} />
                                  <div>{value} Referrals</div>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </div>
              </Card>
              
              {/* Rewards Distribution Chart */}
              <Card className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 sm:flex-1">
                    <CardTitle>Rewards Distribution</CardTitle>
                    <CardDescription>
                      Reward amounts paid over time
                    </CardDescription>
                  </div>
                  <div className="flex sm:border-l sm:min-w-[320px]">
                    {(['all', 'pending', 'paid'] as const).map((status) => (
                      <button
                        key={status}
                        data-active={activeRewardStatus === status}
                        className="flex-1 min-w-[80px] flex flex-col items-start justify-center gap-1 px-4 py-3 h-full text-left border-l first:border-l-0 border-t sm:border-t-0 sm:first:border-l data-[active=true]:bg-muted/50"
                        onClick={() => setActiveRewardStatus(status)}
                      >
                        <span className="text-xs text-muted-foreground capitalize">
                          {status}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {formatCurrency(totalRewardsByStatus[status])}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-80 border-t">
                  {rewardsTrend.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <p className="text-muted-foreground mb-2">No rewards data available for this period</p>
                      <p className="text-xs text-muted-foreground max-w-md">This chart only displays actual rewards data. Select a different time period or check back later when new rewards data becomes available.</p>
                    </div>
                  ) : (
                    <ChartContainer
                      className="h-full aspect-auto p-4"
                      config={rewardsChartConfig}
                    >
                      <BarChart 
                        data={getFilteredRewardsData()}
                        margin={{ left: 20, right: 20, top: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={55}
                          tickFormatter={(value) => formatDateTick(value, selectedTimePeriod)}
                        />
                        <Bar
                          dataKey="value"
                          name="rewards"
                          fill="var(--color-rewards)"
                          radius={[4, 4, 0, 0]}
                          className="z-10"
                        />
                        <ChartTooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            
                            const data = payload[0];
                            const value = data.value;
                            // Use the timestamp to format the date properly
                            const date = new Date(data.payload.timestamp);
                            const formattedDate = format(date, 'MMM dd, yyyy');
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="font-medium">{formattedDate}</div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: "var(--color-rewards)" }} />
                                  <div>{formatCurrencyNoDecimals(Number(value))}</div>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
} 
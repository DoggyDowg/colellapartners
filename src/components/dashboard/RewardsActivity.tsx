import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconGift, IconArrowRight, IconCoin, IconMoodEmpty } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import supabase from '../../lib/supabase';

// Updated to match the Reward interface from the rewards page
interface Reward {
  id: string;
  referral_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  reward_type: 'cash' | 'gift_card';
  gift_card_details?: {
    provider?: string;
    code?: string;
    amount?: number;
    expiry_date?: string;
    notes?: string;
  };
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

interface RewardsActivityProps {
  userId?: string;
  noCard?: boolean; // If true, don't wrap in a Card
}

export function RewardsActivity({ userId, noCard = false }: RewardsActivityProps) {
  const [activities, setActivities] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [hasRewards, setHasRewards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewardActivities = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Updated to use the correct 'rewards' table name and structure
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        throw new Error(`Error fetching rewards: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        setActivities(data as Reward[]);
        setHasRewards(true);
        
        // Calculate total available rewards (pending + approved amounts)
        const total = data.reduce((sum, reward) => {
          // Only count pending and approved rewards, not paid ones
          if (reward.status === 'pending' || reward.status === 'approved') {
            return sum + reward.amount;
          }
          return sum;
        }, 0);
        
        setTotalPoints(total);
      } else {
        setActivities([]);
        setHasRewards(false);
        setTotalPoints(0);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Error loading rewards: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRewardActivities();
    }
  }, [userId, fetchRewardActivities]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const EmptyRewardsState = () => (
    <div className="flex flex-col items-center justify-center py-6 text-center h-[180px]">
      <IconMoodEmpty className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">
        No reward activity yet. Start referring to earn points!
      </p>
    </div>
  );

  const RewardsContent = () => (
    <>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Rewards Activity</CardTitle>
            <CardDescription className="text-sm">Your recent reward transactions</CardDescription>
          </div>
          <div className="text-right sm:text-right">
            <p className="text-sm font-medium">Earned Rewards</p>
            <p className="text-2xl font-bold">{loading ? '...' : `$${totalPoints.toFixed(2)}`}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Loading rewards activity...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-center h-32">
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : hasRewards ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center min-w-0 flex-1">
                  <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                    activity.status === 'pending' || activity.status === 'approved' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}>
                    {activity.status === 'pending' || activity.status === 'approved' ? (
                      <IconCoin className="h-4 w-4" />
                    ) : (
                      <IconGift className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {activity.reward_type === 'cash' ? 'Cash Reward' : 'Gift Card'} 
                      {activity.status === 'pending' ? ' (Pending)' : 
                       activity.status === 'approved' ? ' (Approved)' : ' (Paid)'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
                <Badge variant={activity.status === 'pending' || activity.status === 'approved' ? 'default' : 'outline'} className="flex-shrink-0">
                  ${activity.amount.toFixed(2)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRewardsState />
        )}
      </CardContent>
      <CardFooter className="pt-3">
        <Button asChild variant="outline" className="w-full">
          <Link to="/rewards">
            View All Rewards
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </>
  );

  return noCard ? (
    <RewardsContent />
  ) : (
    <Card>
      <RewardsContent />
    </Card>
  );
} 
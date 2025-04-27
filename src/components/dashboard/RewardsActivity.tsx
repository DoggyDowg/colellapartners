import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconGift, IconArrowRight, IconCoin, IconMoodEmpty } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import supabase from '../../lib/supabase';

interface RewardActivity {
  id: string;
  type: 'earned' | 'redeemed';
  amount: number;
  description: string;
  date: string;
  user_id: string;
}

interface RewardsActivityProps {
  userId?: string;
}

export function RewardsActivity({ userId }: RewardsActivityProps) {
  const [activities, setActivities] = useState<RewardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [hasRewards, setHasRewards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewardActivities = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch reward activities from database
      const { data, error } = await supabase
        .from('reward_activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(3);
        
      if (error) {
        throw new Error(`Error fetching reward activities: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        setActivities(data as RewardActivity[]);
        setHasRewards(true);
        
        // Calculate total points
        const total = data.reduce((sum, activity) => {
          if (activity.type === 'earned') {
            return sum + activity.amount;
          } else {
            return sum - activity.amount;
          }
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Rewards Activity</CardTitle>
            <CardDescription>Your recent reward transactions</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Available Points</p>
            <p className="text-2xl font-bold">{loading ? '...' : totalPoints}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[148px] flex items-center justify-center">
            <p>Loading rewards activity...</p>
          </div>
        ) : error ? (
          <div className="h-[148px] flex items-center justify-center text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : hasRewards ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    activity.type === 'earned' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}>
                    {activity.type === 'earned' ? (
                      <IconCoin className="h-4 w-4" />
                    ) : (
                      <IconGift className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                  </div>
                </div>
                <Badge variant={activity.type === 'earned' ? 'default' : 'outline'}>
                  {activity.type === 'earned' ? '+' : '-'}{activity.amount} pts
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRewardsState />
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/rewards">
            View All Rewards
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 
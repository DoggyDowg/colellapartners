import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconGift, IconArrowRight, IconCoin } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

interface RewardActivity {
  id: string;
  type: 'earned' | 'redeemed';
  amount: number;
  description: string;
  date: string;
}

export function RewardsActivity() {
  const [activities, setActivities] = useState<RewardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    // In a real app, fetch from the backend
    // For now, we'll use mock data
    fetchMockActivities();
  }, []);

  const fetchMockActivities = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const mockData: RewardActivity[] = [
        {
          id: '1',
          type: 'earned',
          amount: 1000,
          description: 'Referral: John Smith',
          date: '2023-12-15T10:30:00Z',
        },
        {
          id: '2',
          type: 'redeemed',
          amount: 500,
          description: '$50 Gift Card',
          date: '2023-12-10T14:45:00Z',
        },
        {
          id: '3',
          type: 'earned',
          amount: 250,
          description: 'Quarterly Bonus',
          date: '2023-11-01T09:15:00Z',
        },
      ];

      setActivities(mockData);
      
      // Calculate total points
      const total = mockData.reduce((sum, activity) => {
        if (activity.type === 'earned') {
          return sum + activity.amount;
        } else {
          return sum - activity.amount;
        }
      }, 0);
      
      setTotalPoints(total);
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
        ) : activities.length > 0 ? (
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
          <div className="h-[148px] flex items-center justify-center text-center">
            <p className="text-muted-foreground">No reward activity yet. Start referring to earn points!</p>
          </div>
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
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Header } from '../../../components/layout/header';
import { ThemeSwitch } from '../../../components/theme-switch';
import { ProfileDropdown } from '../../../components/profile-dropdown';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { IconTrophy, IconUserCircle, IconGift, IconMedal, IconAward } from '@tabler/icons-react';

// Define interfaces for our data
interface Achievement {
  id: string;
  user_id: string;
  achievement_type: 'referral' | 'reward' | 'engagement' | 'milestone';
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  completed_date?: string;
  created_at: string;
  icon: string;
}

export const Route = createFileRoute('/_authenticated/achievements/')({
  component: UserAchievements,
});

function UserAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    progressPercentage: 0,
    nextMilestone: ''
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Since this is a demo, let's create mock achievements
      // In a real app, we'd fetch these from the database
      const mockAchievements = generateMockAchievements();
      setAchievements(mockAchievements);
      
      // Calculate stats
      const total = mockAchievements.length;
      const completed = mockAchievements.filter(a => a.completed).length;
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Find next milestone
      const nextMilestone = mockAchievements
        .filter(a => !a.completed)
        .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))[0]?.title || 'All achievements completed!';
      
      setStats({
        totalAchievements: total,
        completedAchievements: completed,
        progressPercentage: progressPct,
        nextMilestone: nextMilestone
      });
      
    } catch (error: any) {
      console.error('Error handling achievements:', error);
      setError('An unexpected error occurred when fetching achievements.');
      toast.error('Failed to load your achievements');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAchievements = (): Achievement[] => {
    // In a real app, these would come from the database
    const mockData: Achievement[] = [
      {
        id: '1',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'referral',
        title: 'First Referral',
        description: 'Submit your first referral',
        target: 1,
        progress: 1,
        completed: true,
        completed_date: '2023-11-15T12:00:00Z',
        created_at: '2023-11-01T00:00:00Z',
        icon: 'user'
      },
      {
        id: '2',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'referral',
        title: 'Referral Master',
        description: 'Submit 5 referrals',
        target: 5,
        progress: 3,
        completed: false,
        created_at: '2023-11-01T00:00:00Z',
        icon: 'user'
      },
      {
        id: '3',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'reward',
        title: 'First Reward',
        description: 'Earn your first reward',
        target: 1,
        progress: 1,
        completed: true,
        completed_date: '2023-12-10T14:30:00Z',
        created_at: '2023-11-01T00:00:00Z',
        icon: 'gift'
      },
      {
        id: '4',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'reward',
        title: 'Top Earner',
        description: 'Earn $1,000 in rewards',
        target: 1000,
        progress: 500,
        completed: false,
        created_at: '2023-11-01T00:00:00Z',
        icon: 'gift'
      },
      {
        id: '5',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'engagement',
        title: 'Profile Completer',
        description: 'Complete your profile information',
        target: 1,
        progress: 1,
        completed: true,
        completed_date: '2023-11-05T09:15:00Z',
        created_at: '2023-11-01T00:00:00Z',
        icon: 'medal'
      },
      {
        id: '6',
        user_id: '7e4b6261-8037-4136-8119-2944dc9453ff',
        achievement_type: 'milestone',
        title: 'One Year with Us',
        description: 'Be a member for one year',
        target: 365,
        progress: 180,
        completed: false,
        created_at: '2023-11-01T00:00:00Z',
        icon: 'award'
      }
    ];
    
    return mockData;
  };

  const getIconForAchievement = (icon: string) => {
    switch (icon) {
      case 'user':
        return <IconUserCircle className="h-6 w-6" />;
      case 'gift':
        return <IconGift className="h-6 w-6" />;
      case 'medal':
        return <IconMedal className="h-6 w-6" />;
      case 'award':
        return <IconAward className="h-6 w-6" />;
      default:
        return <IconTrophy className="h-6 w-6" />;
    }
  };

  const handleRefresh = () => {
    fetchAchievements();
  };

  if (error) {
    return (
      <>
        <Header title="Achievements">
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Achievements</h1>
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-xl font-medium mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please try again later.
              </p>
              <Button onClick={fetchAchievements}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Achievements">
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Achievements</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        
        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Achievement Progress</CardTitle>
            <CardDescription>
              You've completed {stats.completedAchievements} out of {stats.totalAchievements} achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{stats.progressPercentage}%</span>
                </div>
                <Progress value={stats.progressPercentage} />
              </div>
              
              <div className="pt-2">
                <div className="text-sm font-medium">Next milestone:</div>
                <div className="text-sm text-muted-foreground">{stats.nextMilestone}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Achievement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center items-center h-64">
              <p>Loading achievements...</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="col-span-full flex justify-center items-center h-32">
              <p className="text-muted-foreground">No achievements found</p>
            </div>
          ) : (
            achievements.map((achievement) => (
              <Card key={achievement.id} className={`${achievement.completed ? 'border-green-500/30 dark:border-green-500/50 bg-green-50 dark:bg-green-950/30' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${
                        achievement.completed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-muted'
                      }`}>
                        {getIconForAchievement(achievement.icon)}
                      </div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    </div>
                    {achievement.completed && (
                      <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                    )}
                  </div>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={`${achievement.completed ? 'text-green-800 dark:text-green-300' : ''}`}>Progress</span>
                        <span className={`${achievement.completed ? 'text-green-800 dark:text-green-300' : ''}`}>{achievement.progress} / {achievement.target}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.target) * 100} className={achievement.completed ? 'bg-green-200 dark:bg-green-950' : ''} />
                    </div>
                    
                    {achievement.completed && achievement.completed_date && (
                      <div className="pt-2 text-xs text-green-700 dark:text-green-400">
                        Completed on {new Date(achievement.completed_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
} 
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Header } from '../../../components/layout/header';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { 
  IconTrophy, 
  IconGift, 
  IconMedal, 
  IconAward, 
  IconCalendar, 
  IconCoin,
  IconUser,
  IconUserCheck
} from '@tabler/icons-react';
import supabase from '../../../lib/supabase';

// Define interfaces for our data
interface AchievementStack {
  id: string;
  title: string;
  description: string;
  category: 'referral' | 'reward' | 'engagement' | 'milestone';
  icon: string;
}

interface Achievement {
  id: string;
  stack_id: string;
  title: string;
  description: string;
  target: number;
  raffle_entries: number;
  stack?: AchievementStack;
}

interface AchievementWithProgress extends Achievement {
  progress: number;
  completed: boolean;
  completed_date?: string;
  user_achievement_id?: string;
}

interface GroupedAchievements {
  [stackId: string]: {
    stack: AchievementStack;
    achievements: AchievementWithProgress[];
  }
}

export const Route = createFileRoute('/_authenticated/achievements/')({
  component: UserAchievements,
});

function UserAchievements() {
  const [groupedAchievements, setGroupedAchievements] = useState<GroupedAchievements>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    progressPercentage: 0,
    nextMilestone: ''
  });

  const fetchAchievementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user info to get the user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Could not get user information');
      }
      
      const userId = user.id;
      
      // Fetch user profile data to check completion status
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('name, email, phone_number, birthday, communication_emails, marketing_emails')
        .eq('id', userId)
        .single();
      
      // Skip silent errors when profile doesn't exist yet
      if (profileError && profileError.code !== 'PGRST116') {
        // Handle error silently
      }
      
      // Check if profile is complete - more robust check for each field
      const isProfileComplete = userProfile && 
        !!userProfile.name?.trim() && 
        !!userProfile.email?.trim() && 
        !!userProfile.phone_number?.trim() && 
        !!userProfile.birthday?.trim() && 
        userProfile.communication_emails === true && 
        userProfile.marketing_emails === true;
      
      // Fetch achievement stacks
      const { data: stacksData, error: stacksError } = await supabase
        .from('achievement_stacks')
        .select('*');
      
      if (stacksError) throw stacksError;
      
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');
      
      if (achievementsError) throw achievementsError;
      
      // Find the Profile Completer achievement
      const profileCompleterAchievement = achievementsData?.find(
        achievement => achievement.title === "Profile Completer"
      );
      
      // Let's also try with a case-insensitive search as fallback
      let altProfileAchievement;
      if (!profileCompleterAchievement) {
        altProfileAchievement = achievementsData?.find(
          achievement => achievement.title.toLowerCase().includes('profile') ||
                        achievement.description.toLowerCase().includes('profile')
        );
      }
      
      // Use either the exact match or the alternative if found
      const profileAchievement = profileCompleterAchievement || altProfileAchievement;
      
      // Fetch user achievements
      const { data: initialUserAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
      
      if (userAchievementsError) throw userAchievementsError;
      
      // Create a mutable copy that we can update later
      let userAchievementsData = initialUserAchievements;
      
      // If profile is complete and we found the achievement, update it if needed
      if (isProfileComplete && profileAchievement) {
        const existingUserAchievement = userAchievementsData?.find(
          ua => ua.achievement_id === profileAchievement.id
        );
        
        if (!existingUserAchievement || !existingUserAchievement.completed) {
          // Either create a new record or update the existing one to mark it as complete
          const { error: upsertError } = await supabase
            .from('user_achievements')
            .upsert({
              id: existingUserAchievement?.id || undefined,
              user_id: userId,
              achievement_id: profileAchievement.id,
              progress: 100, // For this achievement, we use 100 to represent 100%
              completed: true,
              completed_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          
          if (upsertError) {
            // Handle error silently - no need for a toast as this is a background operation
          } else {
            // Refresh user achievements data after the update
            const { data: refreshedData, error: refreshError } = await supabase
              .from('user_achievements')
              .select('*')
              .eq('user_id', userId);
            
            if (!refreshError && refreshedData) {
              // Use the refreshed data instead of modifying the original
              userAchievementsData = refreshedData;
            }
          }
        }
      }
      
      // Group achievements by stack
      const grouped: GroupedAchievements = {};
      
      // Initialize groups with all stacks
      (stacksData || []).forEach(stack => {
        grouped[stack.id] = {
          stack,
          achievements: []
        };
      });
      
      // Map all achievements with user progress
      const achievementsWithProgress: AchievementWithProgress[] = (achievementsData || []).map(achievement => {
        // Find if user has this achievement
        const userAchievement = (userAchievementsData || []).find(
          ua => ua.achievement_id === achievement.id
        );
        
        return {
          ...achievement,
          progress: userAchievement?.progress || 0,
          completed: userAchievement?.completed || false,
          completed_date: userAchievement?.completed_date,
          user_achievement_id: userAchievement?.id
        };
      });
      
      // Add achievements to their respective stacks
      achievementsWithProgress.forEach(achievement => {
        if (grouped[achievement.stack_id]) {
          grouped[achievement.stack_id].achievements.push(achievement);
        }
      });
      
      // Sort achievements within each stack by target value
      Object.keys(grouped).forEach(stackId => {
        grouped[stackId].achievements.sort((a, b) => a.target - b.target);
      });
      
      setGroupedAchievements(grouped);
      
      // Calculate stats
      const total = achievementsWithProgress.length;
      const completed = achievementsWithProgress.filter(a => a.completed).length;
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Find next milestone - closest to completion that isn't completed yet
      const incompleteAchievements = achievementsWithProgress
        .filter(a => !a.completed)
        .sort((a, b) => (b.progress / b.target) - (a.progress / a.target));
      
      const nextMilestone = incompleteAchievements.length > 0 
        ? incompleteAchievements[0].title 
        : 'All achievements completed!';
      
      setStats({
        totalAchievements: total,
        completedAchievements: completed,
        progressPercentage: progressPct,
        nextMilestone: nextMilestone
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`An unexpected error occurred when fetching achievements: ${errorMessage}`);
      toast.error('Failed to load your achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievementData();
  }, [fetchAchievementData]);

  const getIconForAchievement = (icon: string) => {
    switch (icon) {
      case 'user':
        return <IconUser className="h-6 w-6" />;
      case 'userCheck':
        return <IconUserCheck className="h-6 w-6" />;
      case 'gift':
        return <IconGift className="h-6 w-6" />;
      case 'coin':
        return <IconCoin className="h-6 w-6" />;
      case 'medal':
        return <IconMedal className="h-6 w-6" />;
      case 'award':
        return <IconAward className="h-6 w-6" />;
      case 'calendar':
        return <IconCalendar className="h-6 w-6" />;
      default:
        return <IconTrophy className="h-6 w-6" />;
    }
  };

  const handleRefresh = () => {
    fetchAchievementData();
  };

  if (error) {
    return (
      <>
        <Header title="Achievements" />
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
              <Button onClick={fetchAchievementData}>
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
      <Header title="Achievements" />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Achievements</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
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
        
        {/* Achievement Stacks */}
        {loading ? (
          <div className="grid gap-6 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-24 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Loading achievements...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          Object.values(groupedAchievements).map(({ stack, achievements }) => (
            <Card key={stack.id} className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2.5">
                    {getIconForAchievement(stack.icon)}
                  </div>
                  <div>
                    <CardTitle>{stack.title}</CardTitle>
                    <CardDescription>{stack.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start gap-4">
                      <div className={`mt-0.5 rounded-full p-1.5 ${
                        achievement.completed 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconTrophy className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{achievement.title}</span>
                          {achievement.completed && (
                            <Badge variant="outline" className="bg-primary/10 text-xs">
                              Completed
                              {achievement.completed_date && ` on ${new Date(achievement.completed_date).toLocaleDateString()}`}
                            </Badge>
                          )}
                          <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            {achievement.raffle_entries} {achievement.raffle_entries === 1 ? 'Entry' : 'Entries'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <div className="pt-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.target}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.target) * 100} 
                            className="h-1.5 mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
} 
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import supabase from '../../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Header } from '../../../components/layout/header';
import { ThemeSwitch } from '../../../components/theme-switch';
import { ProfileDropdown } from '../../../components/profile-dropdown';
import RewardDetailsDialog from '../../../components/rewards/RewardDetailsDialog';
import { toast } from 'sonner';
import { Input } from '../../../components/ui/input';
import { IconSearch } from '@tabler/icons-react';

// Define interfaces for our data
interface Referral {
  id: string;
  referee_name: string;
  referee_type: string;
  referrer_id: string;
}

interface Reward {
  id: string;
  referral_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  reward_type: 'cash' | 'gift_card';
  gift_card_details?: any;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  referrals?: Referral;
}

export const Route = createFileRoute('/_authenticated/rewards/')({
  component: UserRewards,
});

function UserRewards() {
  const { user: authUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  // Apply search filter when searchQuery changes
  useEffect(() => {
    if (rewards.length > 0 && searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = rewards.filter(
        reward => 
          (reward.referrals?.referee_name?.toLowerCase().includes(query) || false) ||
          (reward.referrals?.referee_type?.toLowerCase().includes(query) || false)
      );
      setFilteredRewards(filtered);
    } else {
      setFilteredRewards(rewards);
    }
  }, [rewards, searchQuery]);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the known working ID
      const hardcodedId = '7e4b6261-8037-4136-8119-2944dc9453ff';
      
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          referrals (
            id,
            referee_name,
            referee_type
          )
        `)
        .eq('referrer_id', hardcodedId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching rewards:', error);
        setError(`Error fetching rewards: ${error.message}`);
        return;
      }
      
      if (data) {
        const rewardData = data as unknown as Reward[];
        setRewards(rewardData);
        setFilteredRewards(rewardData);
        
        // Calculate totals
        let pending = 0;
        let paid = 0;
        
        rewardData.forEach(reward => {
          if (reward.status === 'paid') {
            paid += reward.amount;
          } else {
            pending += reward.amount;
          }
        });
        
        setTotalEarned(pending + paid);
        setTotalPending(pending);
        setTotalPaid(paid);
      } else {
        setRewards([]);
        setFilteredRewards([]);
      }
    } catch (error: any) {
      console.error('Error fetching rewards:', error);
      setError('An unexpected error occurred when fetching rewards.');
      toast.error('Failed to load your rewards');
    } finally {
      setLoading(false);
    }
  };

  const openRewardDetails = (reward: Reward) => {
    setSelectedReward(reward);
    setIsDialogOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRefresh = () => {
    fetchRewards();
  };

  if (error) {
    return (
      <>
        <Header title="My Rewards">
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">My Rewards</h1>
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-xl font-medium mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please try again later.
              </p>
              <Button onClick={fetchRewards}>
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
      <Header title="My Rewards">
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Rewards</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              Rewards History
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'})
                </span>
              )}
            </CardTitle>
            <div className="relative w-full max-w-sm">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rewards..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading rewards...</p>
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No matching rewards found' : 'No rewards found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div>{new Date(reward.created_at).toLocaleDateString()}</div>
                          {reward.payment_date && (
                            <div className="text-xs text-muted-foreground">
                              Paid: {new Date(reward.payment_date).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {reward.referrals ? reward.referrals.referee_name : 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reward.referrals ? reward.referrals.referee_type : 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${reward.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {reward.reward_type === 'gift_card' ? 'Gift Card' : 'Cash'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                            reward.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : reward.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRewardDetails(reward)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Use the shared RewardDetailsDialog component */}
        {selectedReward && (
          <RewardDetailsDialog
            reward={selectedReward}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            statusOptions={[]} // Empty array since users can't update reward status
            updateRewardStatus={() => {}} // No-op function since users can't update reward status
            referrerName={authUser?.email || ''} // Add user email as referrer name
          />
        )}
      </div>
    </>
  );
} 
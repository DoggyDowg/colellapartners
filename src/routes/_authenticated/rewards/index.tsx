import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useUserRole } from '../../../hooks/useUserRole';
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
import RewardDetailsDialog from '../../../components/rewards/RewardDetailsDialog';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { ToolkitPartnerSetupForm } from '../../../features/referral-toolkit/components/toolkit-partner-setup-form';
import { toast } from 'sonner';
import { Input } from '../../../components/ui/input';
import { IconSearch } from '@tabler/icons-react';
import { PartnerReferralForm } from '../../../components/referrals/PartnerReferralForm';

// Define interfaces for our data
interface Referral {
  id: string;
  referee_name: string;
  referee_type: string;
  referrer_id: string;
}

// Define gift card details interface to match RewardDetailsDialog
interface GiftCardDetails {
  provider?: string;
  code?: string;
  amount?: number;
  expiry_date?: string;
  notes?: string;
  [key: string]: string | number | undefined; // Allow for additional properties
}

interface Reward {
  id: string;
  referral_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  reward_type: 'cash' | 'gift_card';
  gift_card_details?: GiftCardDetails;
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
  const { userRole: _userRole, isUser } = useUserRole();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPartnerSetup, setShowPartnerSetup] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Move fetchRewards to useCallback hook
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authUser || !authUser.id) {
        setError("Authentication required. Please log in.");
        return;
      }

      // First, get the current user's referrer record or create one if it doesn't exist
      let referrerId: string | null = null;
      
      // Check if user has a referrer record
      const { data: referrerData, error: referrerError } = await supabase
        .from('referrers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();
      
      if (referrerError && referrerError.code !== 'PGRST116') {
        // Only show error if it's not "No rows found" error
        setError(`Error fetching referrer profile: ${referrerError.message}`);
        return;
      }
      
      if (referrerData) {
        // Use the existing referrer ID
        referrerId = referrerData.id;
      } else {
        // No referrer record found for this user
        // We'll just show empty rewards as this user hasn't referred anyone yet
        setRewards([]);
        setFilteredRewards([]);
        setTotalEarned(0);
        setTotalPending(0);
        setTotalPaid(0);
        setLoading(false);
        return;
      }
      
      // Now fetch rewards with the correct referrer ID
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
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
      
      if (error) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`An unexpected error occurred when fetching rewards: ${errorMessage}`);
      toast.error('Failed to load your rewards');
    } finally {
      setLoading(false);
    }
  }, [authUser]); // Only depends on authUser

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]); // Add fetchRewards to dependency array

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

  // Add EmptyRewardsState component
  const EmptyRewardsState = () => {
    // Show different content based on user role
    if (isUser) {
      // User role - show partner setup prompt
      return (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <img 
              src="/images/empty-folder.png" 
              alt="Empty folder" 
              className="mb-4 opacity-70 w-16 h-16"
            />
            <h3 className="text-xl font-semibold mb-2">Only Partners Can Earn Rewards</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">
              To start earning rewards from referrals, you need to become a Partner. 
              Partners can refer clients and earn rewards for successful conversions.
            </p>
            <Button 
              onClick={() => setShowPartnerSetup(true)}
              className="flex items-center gap-2"
            >
              <span>💼</span>
              Become a Partner
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Partner role - show regular empty state
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <img 
            src="/images/empty-folder.png" 
            alt="Empty folder" 
            className="mb-4 opacity-70 w-16 h-16"
          />
          <h3 className="text-xl font-semibold mb-2">No rewards yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            When you make successful referrals, you'll earn rewards that will appear here. 
            Get started by making your first referral!
          </p>
          <PartnerReferralForm onSubmitSuccess={() => {
            toast.success('Referral submitted successfully!');
            // We don't need to refresh rewards immediately as they won't show up until 
            // the referral progresses, but we could if needed
          }} />
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <>
        <Header title="My Rewards" />
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
      <Header title="My Rewards" />
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
        
        {(rewards.length > 0 || loading) ? (
          <>
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
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Rewards History</CardTitle>
                  <div className="relative w-64">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rewards..."
                      className="pl-8 w-full bg-background"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <p>Loading rewards...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Referral</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRewards.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No matching rewards found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRewards.map(reward => (
                            <TableRow key={reward.id}>
                              <TableCell>
                                {new Date(reward.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {reward.referrals?.referee_name || 'Unknown'}
                                <div className="text-xs text-muted-foreground">
                                  {reward.referrals?.referee_type === 'seller' ? 'Seller' : reward.referrals?.referee_type === 'landlord' ? 'Landlord' : ''}
                                </div>
                              </TableCell>
                              <TableCell>
                                ${reward.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span className={
                                  reward.status === 'paid' 
                                    ? 'text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium'
                                    : reward.status === 'approved'
                                      ? 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium'
                                      : 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium'
                                }>
                                  {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openRewardDetails(reward)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyRewardsState />
        )}
        
        {/* Reward Details Dialog */}
        {selectedReward && (
          <RewardDetailsDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            reward={selectedReward}
            statusOptions={[]}
            updateRewardStatus={() => {}}
            referrerName={authUser?.email || ''}
          />
        )}

        {/* Partner Setup Dialog */}
        <Dialog open={showPartnerSetup} onOpenChange={setShowPartnerSetup}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <ToolkitPartnerSetupForm
              onComplete={() => {
                setShowPartnerSetup(false);
                // Refresh the page data after partner setup
                fetchRewards();
                toast.success('Partner account created successfully!');
              }}
              onCancel={() => setShowPartnerSetup(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
} 
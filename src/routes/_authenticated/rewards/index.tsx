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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Header } from '../../../components/layout/header';
import { Search } from '../../../components/search';
import { ThemeSwitch } from '../../../components/theme-switch';
import { ProfileDropdown } from '../../../components/profile-dropdown';

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
  referrals: Referral;
}

export const Route = createFileRoute('/_authenticated/rewards/')({
  component: UserRewards,
});

function UserRewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRewards();
    }
  }, [user]);

  const fetchRewards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
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
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const rewardData = data as unknown as Reward[];
        setRewards(rewardData);
        
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
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRewardDetails = (reward: Reward) => {
    setSelectedReward(reward);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Header title="My Rewards">
        <div className="ml-4 flex-1">
          <Search className="max-w-md" />
        </div>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">My Rewards</h1>
        
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
            <CardTitle className="text-xl">
              Rewards History
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({rewards.length} {rewards.length === 1 ? 'reward' : 'rewards'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading rewards...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">No rewards found</p>
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
                    {rewards.map((reward) => (
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
                          <div className="font-medium">{reward.referrals?.referee_name}</div>
                          <div className="text-sm text-muted-foreground">{reward.referrals?.referee_type}</div>
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
        
        {/* Reward Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            {selectedReward && (
              <>
                <DialogHeader>
                  <DialogTitle>Reward Details</DialogTitle>
                  <DialogDescription>
                    Details for {selectedReward.referrals?.referee_name}'s referral reward
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Reward Information</h3>
                      <div className="mt-1 space-y-2">
                        <p><span className="font-medium">Amount:</span> ${selectedReward.amount.toFixed(2)}</p>
                        <p><span className="font-medium">Type:</span> {selectedReward.reward_type === 'gift_card' ? 'Gift Card' : 'Cash'}</p>
                        <p><span className="font-medium">Created:</span> {new Date(selectedReward.created_at).toLocaleString()}</p>
                        {selectedReward.payment_date && (
                          <p><span className="font-medium">Payment Date:</span> {new Date(selectedReward.payment_date).toLocaleString()}</p>
                        )}
                        <p>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${
                            selectedReward.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedReward.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedReward.status.charAt(0).toUpperCase() + selectedReward.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Referral Information</h3>
                      <div className="mt-1 space-y-2">
                        <p><span className="font-medium">Referee Name:</span> {selectedReward.referrals?.referee_name}</p>
                        <p><span className="font-medium">Referral Type:</span> {selectedReward.referrals?.referee_type}</p>
                        <p><span className="font-medium">Referral ID:</span> {selectedReward.referral_id}</p>
                      </div>
                    </div>
                    
                    {selectedReward.gift_card_details && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Gift Card Details</h3>
                        <div className="mt-1 space-y-2">
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                            {JSON.stringify(selectedReward.gift_card_details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
} 
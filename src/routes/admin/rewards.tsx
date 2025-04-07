import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { toast } from 'sonner';
import RewardDetailsDialog from '../../components/rewards/RewardDetailsDialog';

// Define interfaces for our data
interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface Referral {
  id: string;
  referee_name: string;
  referee_type: string;
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
  referrers?: Referrer;
  referrals?: Referral;
}

export const Route = createFileRoute('/admin/rewards')({
  component: AdminRewards,
});

function AdminRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Status options
  const statusOptions = [
    'pending',
    'approved',
    'paid'
  ];

  useEffect(() => {
    fetchRewards();
  }, [statusFilter, typeFilter]);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('rewards')
        .select(`
          *,
          referrers (
            id,
            full_name,
            email,
            phone
          ),
          referrals (
            id,
            referee_name,
            referee_type,
            referrer_id
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('reward_type', typeFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        setError(`Error fetching rewards: ${error.message}`);
        return;
      }
      
      if (data) {
        let filteredData = data as unknown as Reward[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            reward => 
              (reward.referrers?.full_name?.toLowerCase().includes(query) || false) ||
              (reward.referrers?.email?.toLowerCase().includes(query) || false) ||
              (reward.referrals?.referee_name?.toLowerCase().includes(query) || false)
          );
        }
        
        setRewards(filteredData);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setError('An unexpected error occurred when fetching rewards.');
    } finally {
      setLoading(false);
    }
  };

  const openRewardDetails = (reward: Reward) => {
    setSelectedReward(reward);
    setIsDialogOpen(true);
  };

  const updateRewardStatus = async (rewardId: string, newStatus: string) => {
    try {
      // Validate the status is one of our expected values
      if (!['pending', 'approved', 'paid'].includes(newStatus)) {
        console.error('Invalid status:', newStatus);
        toast.error('Invalid status value');
        return;
      }
      
      const validStatus = newStatus as 'pending' | 'approved' | 'paid';
      let updateData: any = { status: validStatus };
      
      // If status is changed to 'paid', update payment date
      if (validStatus === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('rewards')
        .update(updateData)
        .eq('id', rewardId);
      
      if (error) {
        console.error('Error updating reward status:', error);
        return;
      }
      
      // Update local state
      setRewards(prevRewards => 
        prevRewards.map(reward => {
          if (reward.id === rewardId) {
            return { 
              ...reward, 
              status: validStatus,
              payment_date: validStatus === 'paid' ? new Date().toISOString() : reward.payment_date
            };
          }
          return reward;
        })
      );
      
      // If this is the selected reward, update it too
      if (selectedReward && selectedReward.id === rewardId) {
        setSelectedReward({
          ...selectedReward,
          status: validStatus,
          payment_date: validStatus === 'paid' ? new Date().toISOString() : selectedReward.payment_date
        });
      }
      
    } catch (error) {
      console.error('Error updating reward status:', error);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    fetchRewards();
  };

  // Function to handle adding a new reward (placeholder for now)
  const handleAddReward = () => {
    alert('Add reward functionality to be implemented');
  };

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Rewards Management</h1>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please check your database configuration or try again later.
            </p>
            <Button onClick={() => fetchRewards()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Rewards Management</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Reward Type</Label>
              <Select 
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="seller">Seller ($500)</SelectItem>
                  <SelectItem value="landlord">Landlord ($200)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => fetchRewards()}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>
              Rewards
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({rewards.length} {rewards.length === 1 ? 'reward' : 'rewards'})
                </span>
              )}
            </span>
            
            <Button 
              size="sm"
              onClick={handleAddReward}
            >
              Add Reward
            </Button>
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
                    <TableHead>Partner</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div className="font-medium">{reward.referrers?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{reward.referrers?.email || 'No email'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{reward.referrals?.referee_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{reward.referrals?.referee_type || 'Unknown'}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${reward.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {reward.reward_type === 'gift_card' ? 'Gift Card' : 'Cash'}
                      </TableCell>
                      <TableCell>
                        <div>{new Date(reward.created_at).toLocaleDateString()}</div>
                        {reward.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Paid: {new Date(reward.payment_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                          reward.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : reward.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(reward.status || 'pending').charAt(0).toUpperCase() + (reward.status || 'pending').slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRewardDetails(reward)}
                          >
                            Manage
                          </Button>
                        </div>
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
      <RewardDetailsDialog
        reward={selectedReward}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        statusOptions={statusOptions}
        updateRewardStatus={updateRewardStatus}
      />
    </div>
  );
}

export default AdminRewards; 
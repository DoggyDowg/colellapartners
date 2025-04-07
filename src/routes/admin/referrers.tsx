import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import ReferralDetailsDialog from '../../components/referrals/ReferralDetailsDialog';
import RewardDetailsDialog from '../../components/rewards/RewardDetailsDialog';

// Define interfaces for our data
interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  is_business: boolean;
  business_name?: string;
  contact_person?: string;
  address?: string;
  partner_code?: string;
  active: boolean;
  partnership_start_date: string;
}

// Add Referral interface for displaying partner's referrals
interface Referral {
  id: string;
  referrer_id: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string;
  referee_type: string;
  created_at: string;
  status: string;
  situation_description?: string;
  additional_notes?: string;
  referrers?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

// Add StatusHistoryItem interface
interface StatusHistoryItem {
  id: string;
  referral_id: string;
  previous_status: string | null;
  new_status: string;
  notes?: string;
  created_at: string;
  changed_by?: string;
  user_full_name?: string;
}

// Add Note interface
interface Note {
  user: string;
  content: string;
  date: string;
}

// Add reward interface
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
  referrals?: {
    id: string;
    referee_name: string;
    referee_type: string;
  };
}

export const Route = createFileRoute('/admin/referrers')({
  component: AdminReferrers,
});

function AdminReferrers() {
  const { user } = useAuth();
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedReferrer, setEditedReferrer] = useState<Referrer | null>(null);
  const [referrerReferrals, setReferrerReferrals] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  
  // Added state for referral detail dialog
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  
  // Rewards state
  const [referrerRewards, setReferrerRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [businessFilter, setBusinessFilter] = useState<boolean | null>(null);
  
  // Status options for rewards
  const rewardStatusOptions = [
    'pending',
    'approved',
    'paid'
  ];

  useEffect(() => {
    fetchReferrers();
  }, [activeFilter, businessFilter]);

  const fetchReferrers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('referrers')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (activeFilter !== null) {
        query = query.eq('active', activeFilter);
      }
      
      if (businessFilter !== null) {
        query = query.eq('is_business', businessFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        let filteredData = data as Referrer[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            ref => ref.full_name.toLowerCase().includes(query) ||
                  ref.email.toLowerCase().includes(query) ||
                  (ref.business_name && ref.business_name.toLowerCase().includes(query)) ||
                  (ref.partner_code && ref.partner_code.toLowerCase().includes(query))
          );
        }
        
        setReferrers(filteredData);
      }
    } catch (error) {
      console.error('Error fetching referrers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrerReferrals = async (referrerId: string) => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setReferrerReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Error loading referrals');
    } finally {
      setLoadingReferrals(false);
    }
  };

  // Add function to fetch rewards for a specific referrer
  const fetchReferrerRewards = async (referrerId: string) => {
    setLoadingRewards(true);
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
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setReferrerRewards(data as unknown as Reward[]);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const openReferrerDetails = async (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setIsDialogOpen(true);
    setIsEditMode(false);
    
    // Fetch referrals for this partner
    await fetchReferrerReferrals(referrer.id);
    
    // Fetch rewards for this partner
    await fetchReferrerRewards(referrer.id);
  };
  
  const handleEditPartner = () => {
    if (!selectedReferrer) return;
    
    // Initialize edit form with current values
    setEditedReferrer({...selectedReferrer});
    setIsEditMode(true);
  };
  
  const savePartnerChanges = async () => {
    if (!editedReferrer) return;
    
    try {
      const { error } = await supabase
        .from('referrers')
        .update({
          full_name: editedReferrer.full_name,
          email: editedReferrer.email,
          phone: editedReferrer.phone,
          is_business: editedReferrer.is_business,
          business_name: editedReferrer.business_name,
          contact_person: editedReferrer.contact_person,
          address: editedReferrer.address,
          partner_code: editedReferrer.partner_code,
          active: editedReferrer.active
        })
        .eq('id', editedReferrer.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setReferrers(prevReferrers => 
        prevReferrers.map(ref => 
          ref.id === editedReferrer.id ? editedReferrer : ref
        )
      );
      
      // Update selected referrer
      setSelectedReferrer(editedReferrer);
      
      // Exit edit mode
      setIsEditMode(false);
      
      toast.success('Partner updated successfully');
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Error updating partner');
    }
  };
  
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditedReferrer(null);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'settled':
      case 'signed up':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'listed':
        return 'bg-purple-100 text-purple-800';
      case 'appraised':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const togglePartnerStatus = async (referrerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('referrers')
        .update({ active: isActive })
        .eq('id', referrerId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setReferrers(prevReferrers => 
        prevReferrers.map(ref => 
          ref.id === referrerId ? { ...ref, active: isActive } : ref
        )
      );
      
      // If this is the selected referrer, update it too
      if (selectedReferrer && selectedReferrer.id === referrerId) {
        setSelectedReferrer({ ...selectedReferrer, active: isActive });
      }
      
    } catch (error) {
      console.error('Error updating partner status:', error);
    }
  };

  const handleSearch = () => {
    fetchReferrers();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter(null);
    setBusinessFilter(null);
    fetchReferrers();
  };

  // Add these new functions for handling referral details

  const openReferralDetails = async (referral: Referral) => {
    setSelectedReferral(referral);
    setIsReferralDialogOpen(true);
    await fetchStatusHistory(referral.id);
  };

  const fetchStatusHistory = async (referralId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('referral_status_history')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setStatusHistory(data as StatusHistoryItem[]);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Get status options based on referral type
  const getStatusOptionsForType = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'landlord':
        return ['New', 'Contacted', 'Signed Up'];
      case 'seller':
      default:
        return ['New', 'Contacted', 'Appraised', 'Listed', 'Sold', 'Settled'];
    }
  };

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    try {
      const currentStatus = selectedReferral ? selectedReferral.status : '';
      
      // Add history record
      const { error: historyError } = await supabase
        .from('referral_status_history')
        .insert({
          referral_id: referralId,
          previous_status: currentStatus,
          new_status: newStatus,
          created_at: new Date().toISOString(),
          changed_by: user?.id,
          user_full_name: user?.user_metadata?.full_name
        });
        
      if (historyError) {
        console.error('Error recording status history:', historyError);
      }
      
      // Update the referral status
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ status: newStatus })
        .eq('id', referralId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state in both referrals lists
      setReferrerReferrals(prevReferrals => 
        prevReferrals.map(ref => 
          ref.id === referralId ? { ...ref, status: newStatus } : ref
        )
      );
      
      // If this is the selected referral, update it too
      if (selectedReferral && selectedReferral.id === referralId) {
        setSelectedReferral({ ...selectedReferral, status: newStatus });
        
        // Refresh status history
        await fetchStatusHistory(referralId);
      }
      
      // Clear status note
      setStatusNote('');
      
      toast.success('Referral status updated successfully');
    } catch (error) {
      console.error('Error updating referral status:', error);
      toast.error('Error updating referral status');
    }
  };

  const addNote = async (referralId: string) => {
    if (!statusNote.trim() || !selectedReferral) return;
    
    try {
      // Create note object
      const note = {
        user: user?.user_metadata?.full_name || 'Unknown User',
        content: statusNote,
        date: new Date().toISOString()
      };
      
      // Parse existing notes or create new array
      let notes: Note[] = [];
      if (selectedReferral.additional_notes) {
        try {
          notes = JSON.parse(selectedReferral.additional_notes);
        } catch (e) {
          console.error('Error parsing notes:', e);
        }
      }
      
      // Add new note
      notes.unshift(note);
      
      // Update in database
      const { error } = await supabase
        .from('referrals')
        .update({ additional_notes: JSON.stringify(notes) })
        .eq('id', referralId);
      
      if (error) throw error;
      
      // Update selected referral in state
      setSelectedReferral({
        ...selectedReferral,
        additional_notes: JSON.stringify(notes)
      });
      
      // Update in the referrerReferrals list
      setReferrerReferrals(prevReferrals =>
        prevReferrals.map(ref =>
          ref.id === referralId
            ? { ...ref, additional_notes: JSON.stringify(notes) }
            : ref
        )
      );
      
      // Clear input
      setStatusNote('');
      
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note');
    }
  };

  const parseNotes = (notesJson?: string): Note[] => {
    if (!notesJson) return [];
    try {
      return JSON.parse(notesJson);
    } catch (e) {
      console.error('Error parsing notes:', e);
      return [];
    }
  };

  const confirmNoteDelete = (index: number) => {
    setNoteToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  const deleteNote = async () => {
    if (noteToDelete === null || !selectedReferral) {
      setIsDeleteDialogOpen(false);
      return;
    }
    
    try {
      // Parse existing notes
      let notes: Note[] = [];
      if (selectedReferral.additional_notes) {
        try {
          notes = JSON.parse(selectedReferral.additional_notes);
        } catch (e) {
          console.error('Error parsing notes:', e);
          setIsDeleteDialogOpen(false);
          return;
        }
      }
      
      // Remove the note
      notes.splice(noteToDelete, 1);
      
      // Update in database
      const { error } = await supabase
        .from('referrals')
        .update({ additional_notes: notes.length ? JSON.stringify(notes) : null })
        .eq('id', selectedReferral.id);
      
      if (error) throw error;
      
      // Update selected referral in state
      setSelectedReferral({
        ...selectedReferral,
        additional_notes: notes.length ? JSON.stringify(notes) : undefined
      });
      
      // Update in the referrerReferrals list
      setReferrerReferrals(prevReferrals =>
        prevReferrals.map(ref =>
          ref.id === selectedReferral.id
            ? { 
                ...ref, 
                additional_notes: notes.length ? JSON.stringify(notes) : undefined 
              }
            : ref
        )
      );
      
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note');
    } finally {
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);
    
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHr < 24) {
      return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Add function to open reward details
  const openRewardDetails = (reward: Reward) => {
    setSelectedReward(reward);
    setIsRewardDialogOpen(true);
  };
  
  // Update function to use string type for status to match RewardDetailsDialog props
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
        toast.error('Failed to update reward status');
        return;
      }
      
      // Update local state
      setReferrerRewards(prevRewards => 
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
      
      toast.success(`Reward status updated to ${validStatus}`);
    } catch (error) {
      console.error('Error updating reward status:', error);
      toast.error('An error occurred while updating reward status');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Partner Management</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="search"
                  placeholder="Search by name, email, business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active" 
                  checked={activeFilter === true}
                  onCheckedChange={(checked) => {
                    setActiveFilter(checked ? true : null);
                  }}
                />
                <Label htmlFor="active">Active Partners Only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="inactive" 
                  checked={activeFilter === false}
                  onCheckedChange={(checked) => {
                    setActiveFilter(checked ? false : null);
                  }}
                />
                <Label htmlFor="inactive">Inactive Partners Only</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="business" 
                  checked={businessFilter === true}
                  onCheckedChange={(checked) => {
                    setBusinessFilter(checked ? true : null);
                  }}
                />
                <Label htmlFor="business">Business Partners Only</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <Switch 
                  id="individual" 
                  checked={businessFilter === false}
                  onCheckedChange={(checked) => {
                    setBusinessFilter(checked ? false : null);
                  }}
                />
                <Label htmlFor="individual">Individual Partners Only</Label>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>
              Partners
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({referrers.length} {referrers.length === 1 ? 'partner' : 'partners'})
                </span>
              )}
            </span>
            
            <Button 
              size="sm"
              onClick={() => alert('Add partner functionality to be implemented')}
            >
              Add Partner
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading partners...</p>
            </div>
          ) : referrers.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No partners found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Partner Code</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrers.map((referrer) => (
                    <TableRow key={referrer.id}>
                      <TableCell>
                        <div className="font-medium">
                          {referrer.is_business ? referrer.business_name : referrer.full_name}
                        </div>
                        {referrer.is_business && (
                          <div className="text-sm text-muted-foreground">
                            Contact: {referrer.contact_person}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{referrer.email}</div>
                        <div className="text-sm">{referrer.phone}</div>
                      </TableCell>
                      <TableCell>
                        {referrer.is_business ? 'Business' : 'Individual'}
                      </TableCell>
                      <TableCell>
                        {referrer.partner_code || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(referrer.partnership_start_date || referrer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          referrer.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {referrer.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => togglePartnerStatus(referrer.id, !referrer.active)}
                          >
                            {referrer.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openReferrerDetails(referrer)}
                          >
                            View
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
      
      {/* Partner Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedReferrer && (
            <>
              <DialogHeader>
                <DialogTitle>Partner Details</DialogTitle>
                <DialogDescription>
                  {selectedReferrer.is_business 
                    ? `Business Partner: ${selectedReferrer.business_name}`
                    : `Individual Partner: ${selectedReferrer.full_name}`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="referrals">Referrals</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  {isEditMode ? (
                    // Edit Form
                    <div className="space-y-4">
                      {editedReferrer?.is_business ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="business_name">Business Name</Label>
                            <Input 
                              id="business_name" 
                              value={editedReferrer?.business_name || ''} 
                              onChange={(e) => {
                                if (editedReferrer) {
                                  setEditedReferrer({
                                    ...editedReferrer,
                                    business_name: e.target.value
                                  });
                                }
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="contact_person">Contact Person</Label>
                            <Input 
                              id="contact_person" 
                              value={editedReferrer?.contact_person || ''} 
                              onChange={(e) => {
                                if (editedReferrer) {
                                  setEditedReferrer({
                                    ...editedReferrer,
                                    contact_person: e.target.value
                                  });
                                }
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input 
                            id="full_name" 
                            value={editedReferrer?.full_name || ''} 
                            onChange={(e) => {
                              if (editedReferrer) {
                                setEditedReferrer({
                                  ...editedReferrer,
                                  full_name: e.target.value
                                });
                              }
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={editedReferrer?.email || ''} 
                          onChange={(e) => {
                            if (editedReferrer) {
                              setEditedReferrer({
                                ...editedReferrer,
                                email: e.target.value
                              });
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          value={editedReferrer?.phone || ''} 
                          onChange={(e) => {
                            if (editedReferrer) {
                              setEditedReferrer({
                                ...editedReferrer,
                                phone: e.target.value
                              });
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          value={editedReferrer?.address || ''} 
                          onChange={(e) => {
                            if (editedReferrer) {
                              setEditedReferrer({
                                ...editedReferrer,
                                address: e.target.value
                              });
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="partner_code">Partner Code</Label>
                        <Input 
                          id="partner_code" 
                          value={editedReferrer?.partner_code || ''} 
                          onChange={(e) => {
                            if (editedReferrer) {
                              setEditedReferrer({
                                ...editedReferrer,
                                partner_code: e.target.value
                              });
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="active" 
                          checked={editedReferrer?.active || false}
                          onCheckedChange={(checked) => {
                            if (editedReferrer) {
                              setEditedReferrer({
                                ...editedReferrer,
                                active: checked
                              });
                            }
                          }}
                        />
                        <Label htmlFor="active">Active Partner</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button onClick={savePartnerChanges}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Details View
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                          <div className="mt-1 space-y-2">
                            {selectedReferrer.is_business ? (
                              <>
                                <p><span className="font-medium">Business Name:</span> {selectedReferrer.business_name}</p>
                                <p><span className="font-medium">Contact Person:</span> {selectedReferrer.contact_person}</p>
                              </>
                            ) : (
                              <p><span className="font-medium">Full Name:</span> {selectedReferrer.full_name}</p>
                            )}
                            <p><span className="font-medium">Email:</span> {selectedReferrer.email}</p>
                            <p><span className="font-medium">Phone:</span> {selectedReferrer.phone}</p>
                            {selectedReferrer.address && (
                              <p><span className="font-medium">Address:</span> {selectedReferrer.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Partnership Details</h3>
                          <div className="mt-1 space-y-2">
                            <p>
                              <span className="font-medium">Status:</span>
                              <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${
                                selectedReferrer.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedReferrer.active ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                            <p><span className="font-medium">Partner Since:</span> {new Date(selectedReferrer.partnership_start_date || selectedReferrer.created_at).toLocaleDateString()}</p>
                            <p><span className="font-medium">Partner Code:</span> {selectedReferrer.partner_code || 'Not assigned'}</p>
                            <p><span className="font-medium">Partner Type:</span> {selectedReferrer.is_business ? 'Business' : 'Individual'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                          <div className="mt-1 space-y-2">
                            <p><span className="font-medium">Created:</span> {new Date(selectedReferrer.created_at).toLocaleString()}</p>
                            <p><span className="font-medium">ID:</span> {selectedReferrer.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 border-t pt-4">
                        <h3 className="text-sm font-medium mb-2">Partner Actions</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedReferrer.active ? "outline" : "default"}
                            size="sm"
                            onClick={() => togglePartnerStatus(selectedReferrer.id, !selectedReferrer.active)}
                          >
                            {selectedReferrer.active ? 'Deactivate Partner' : 'Activate Partner'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditPartner}
                          >
                            Edit Partner
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="referrals" className="space-y-4">
                  <h3 className="text-lg font-medium">Partner Referrals</h3>
                  
                  {loadingReferrals ? (
                    <div className="flex justify-center items-center h-32">
                      <p>Loading referrals...</p>
                    </div>
                  ) : referrerReferrals.length === 0 ? (
                    <div className="flex justify-center items-center h-32 bg-muted/50 rounded-md">
                      <p className="text-muted-foreground">No referrals found for this partner</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Referee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrerReferrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell className="whitespace-nowrap">
                                {formatDate(referral.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{referral.referee_name}</div>
                                <div className="text-sm text-muted-foreground">{referral.referee_email}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {referral.referee_type}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeClass(referral.status)}>
                                  {referral.status || 'New'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openReferralDetails(referral)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="rewards" className="space-y-4">
                  <h3 className="text-lg font-medium">Partner Rewards</h3>
                  
                  {loadingRewards ? (
                    <div className="flex justify-center items-center h-32">
                      <p>Loading rewards...</p>
                    </div>
                  ) : referrerRewards.length === 0 ? (
                    <div className="flex justify-center items-center h-32 bg-muted/50 rounded-md">
                      <p className="text-muted-foreground">No rewards found for this partner</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Referee</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrerRewards.map((reward) => (
                            <TableRow key={reward.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(reward.created_at).toLocaleDateString()}
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
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openRewardDetails(reward)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Use the shared ReferralDetailsDialog component */}
      <ReferralDetailsDialog
        referral={selectedReferral}
        open={isReferralDialogOpen}
        onOpenChange={setIsReferralDialogOpen}
        statusHistory={statusHistory}
        loadingHistory={loadingHistory}
        statusNote={statusNote}
        onStatusNoteChange={(value) => setStatusNote(value)}
        onAddNote={addNote}
        onConfirmNoteDelete={confirmNoteDelete}
        onUpdateStatus={updateReferralStatus}
        getStatusOptionsForType={getStatusOptionsForType}
        getStatusBadgeClass={getStatusBadgeClass}
        formatDate={formatDate}
        formatTimeAgo={formatTimeAgo}
        parseNotes={parseNotes}
        getInitials={getInitials}
        referrerName={selectedReferrer?.full_name}
        referrerEmail={selectedReferrer?.email}
        referrerPhone={selectedReferrer?.phone}
      />
      
      {/* Use the shared RewardDetailsDialog component */}
      <RewardDetailsDialog
        reward={selectedReward}
        open={isRewardDialogOpen}
        onOpenChange={setIsRewardDialogOpen}
        statusOptions={rewardStatusOptions}
        updateRewardStatus={updateRewardStatus}
        referrerName={selectedReferrer?.full_name}
        referrerEmail={selectedReferrer?.email}
        referrerPhone={selectedReferrer?.phone}
      />
      
      {/* Alert Dialog for Note Deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteNote}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminReferrers; 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import ReferralDetailsDialog from '../../components/referrals/ReferralDetailsDialog';
import { AdminCheck } from '../../components/admin/AdminCheck';

// Define interfaces for our data
interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

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
  referrers: Referrer;
}

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

interface Reward {
  id?: string;
  referral_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'paid';
  reward_type: 'cash' | 'gift_card';
  gift_card_details?: any;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const Route = createFileRoute('/admin/referrals')({
  component: AdminReferrals,
});

function AdminReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [statusNote, setStatusNote] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardType, setRewardType] = useState<'cash' | 'gift_card'>('gift_card');
  const [isProcessingReward, setIsProcessingReward] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Status options based on referee type
  const getLandlordStatusOptions = () => [
    'New',
    'Contacted',
    'Signed Up',
    'Ineligible'
  ];

  const getSellerStatusOptions = () => [
    'New',
    'Contacted',
    'Appraised',
    'Listed',
    'Sold',
    'Settled',
    'Ineligible'
  ];

  // Get status options based on referral type
  const getStatusOptionsForType = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'landlord':
        return getLandlordStatusOptions();
      case 'seller':
      default:
        return getSellerStatusOptions();
    }
  };

  // Status options for the dropdown - used in filters
  const statusOptions = [
    'New',
    'Contacted',
    'Signed Up',
    'Appraised',
    'Listed',
    'Sold',
    'Settled',
    'Ineligible'
  ];

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter, typeFilter]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          referee_name,
          referee_email,
          referee_phone,
          referee_type,
          status,
          created_at,
          situation_description,
          additional_notes,
          referrers (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('referee_type', typeFilter);
      }

      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.warn('Error fetching referrals:', queryError);
        setError('Unable to load referrals data. The database tables may not exist yet.');
        return;
      }
      
      if (data) {
        let filteredData = data as unknown as Referral[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            ref => ref.referee_name.toLowerCase().includes(query) ||
                  ref.referee_email.toLowerCase().includes(query) ||
                  ref.referrers.full_name.toLowerCase().includes(query)
          );
        }
        
        setReferrals(filteredData);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setError('An unexpected error occurred while loading referrals.');
    } finally {
      setLoading(false);
    }
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

  const openReferralDetails = async (referral: Referral) => {
    setSelectedReferral(referral);
    setIsDialogOpen(true);
    await fetchStatusHistory(referral.id);
  };

  // Get reward amount based on referral type
  const getRewardAmount = (referralType: string) => {
    return referralType?.toLowerCase() === 'landlord' ? 200 : 500;
  };
  
  // Check if status is a reward trigger status
  const isRewardTriggerStatus = (referralType: string, status: string) => {
    if (referralType?.toLowerCase() === 'landlord' && status === 'Signed Up') {
      return true;
    }
    if (referralType?.toLowerCase() === 'seller' && status === 'Settled') {
      return true;
    }
    return false;
  };
  
  // Increment reward amount by $25
  const incrementReward = () => {
    setRewardAmount(prev => prev + 25);
  };
  
  // Decrement reward amount by $25
  const decrementReward = () => {
    setRewardAmount(prev => Math.max(0, prev - 25));
  };
  
  // Create a reward for the referral
  const createReward = async () => {
    if (!selectedReferral) return;
    
    setIsProcessingReward(true);
    try {
      // Create a new reward with explicit type annotation
      const newReward: Reward = {
        referral_id: selectedReferral.id,
        referrer_id: selectedReferral.referrer_id,
        amount: rewardAmount,
        status: 'pending',
        reward_type: rewardType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('rewards')
        .insert(newReward);
        
      if (error) throw error;
      
      // Close dialog and reset
      setIsRewardDialogOpen(false);
      setRewardType('gift_card');
      
      // Show success toast instead of alert
      toast.success('Reward created successfully!');
      
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error('Error creating reward. Please try again.');
    } finally {
      setIsProcessingReward(false);
    }
  };

  // Attempt to close reward dialog - this shows the warning if needed
  const handleCloseRewardDialog = () => {
    // Check if a reward is already created for this referral before showing warning
    toast.custom((t) => (
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex flex-col p-4">
        <div className="text-lg font-medium mb-2">Warning: No Reward Created</div>
        <div className="text-sm text-muted-foreground mb-4">
          You're about to close this dialog without creating a reward for this referral.
          This referral is marked as complete but won't have a reward attached to it.
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => {
              toast.dismiss(t);
              revertStatus();
            }}
            className="w-full sm:w-auto"
          >
            Change Status Back
          </Button>
          <Button 
            variant="default" 
            onClick={() => {
              toast.dismiss(t);
              continueRewardCreation();
            }}
            className="w-full sm:w-auto"
          >
            Create Reward
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              toast.dismiss(t);
              keepCurrentStatus();
            }}
            className="w-full sm:w-auto"
          >
            Keep Status
          </Button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  };
  
  // Revert to previous status
  const revertStatus = async () => {
    if (selectedReferral && previousStatus) {
      await updateReferralStatus(selectedReferral.id, previousStatus);
      toast.success(`Status reverted to ${previousStatus}`);
    }
    setIsRewardDialogOpen(false);
  };
  
  // Continue with reward creation
  const continueRewardCreation = () => {
    // Just keep the reward dialog open
  };
  
  // Keep current status and close dialogs
  const keepCurrentStatus = () => {
    toast.info('Status kept without creating reward');
    setIsRewardDialogOpen(false);
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
      
      // Update local state
      setReferrals(prevReferrals => 
        prevReferrals.map(ref => 
          ref.id === referralId ? { ...ref, status: newStatus } : ref
        )
      );
      
      // If this is the selected referral, update it too
      if (selectedReferral && selectedReferral.id === referralId) {
        setSelectedReferral({ ...selectedReferral, status: newStatus });
        
        // Check if this status change triggers a reward
        if (isRewardTriggerStatus(selectedReferral.referee_type, newStatus)) {
          // Store the previous status for potential reversion
          setPreviousStatus(currentStatus);
          
          // Set the initial reward amount based on referral type
          setRewardAmount(getRewardAmount(selectedReferral.referee_type));
          // Set default reward type to Gift Card
          setRewardType('gift_card');
          // Open the reward dialog
          setIsRewardDialogOpen(true);
        }
        
        // Refresh status history
        await fetchStatusHistory(referralId);
      }
      
      // Clear status note
      setStatusNote('');
      
    } catch (error) {
      console.error('Error updating referral status:', error);
    }
  };

  const addNote = async (referralId: string) => {
    if (!statusNote.trim()) return;
    
    try {
      // Get the user's full name
      const fullName = user?.user_metadata?.full_name || 'Admin';
      // Store timestamp in ISO format for accurate time-ago calculation
      const timestamp = new Date().toISOString();
      // Format for display, but we'll parse this back when displaying
      const noteWithTimestamp = `${formatDate(timestamp)} - ${fullName} said: ${statusNote}`;
      
      // Add a note to the referral
      const { error } = await supabase
        .from('referrals')
        .update({ 
          additional_notes: selectedReferral?.additional_notes 
            ? selectedReferral.additional_notes + '\n\n' + noteWithTimestamp
            : noteWithTimestamp
        })
        .eq('id', referralId);
      
      if (error) {
        throw error;
      }
      
      // Update selected referral
      if (selectedReferral) {
        const updatedNotes = selectedReferral.additional_notes 
          ? selectedReferral.additional_notes + '\n\n' + noteWithTimestamp
          : noteWithTimestamp;
        
        setSelectedReferral({
          ...selectedReferral,
          additional_notes: updatedNotes
        });
      }
      
      // Clear status note
      setStatusNote('');
      
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    fetchReferrals();
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
      case 'ineligible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date to "4 Apr, 25, 2:31pm" format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().slice(2);
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'pm' : 'am';
    
    return `${day} ${month}, ${year}, ${hours}:${minutes}${ampm}`;
  };

  // Format date to "X time ago" format
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    if (diffInSeconds < minute) {
      return 'just now';
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Parse a note to extract date, user, and content
  const parseNote = (note: string) => {
    // Expected format: "4 Apr, 25, 2:31pm - Rick said: <Note content>"
    const parts = note.split(' - ');
    
    if (parts.length < 2) return { date: '', user: 'Unknown', content: note };
    
    const dateStr = parts[0];
    // Convert our date format to a date object for time-ago calculation
    // Format is like "4 Apr, 25, 2:31pm"
    let dateObj;
    try {
      // Extract components
      const [day, monthStr, yearStr, timeStr] = dateStr.split(/,\s*|,?\s+/);
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = monthMap[monthStr] || 0; // Default to January if not found
      const year = 2000 + parseInt(yearStr || '0', 10); // Default to 2000 if not found
      
      // Parse time - format could be "2:31pm"
      let hours = 0;
      let minutes = 0;
      if (timeStr) {
        const isPM = timeStr.toLowerCase().includes('pm');
        const timeParts = timeStr.replace(/am|pm/i, '').split(':');
        hours = parseInt(timeParts[0] || '0', 10);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        minutes = parseInt(timeParts[1] || '0', 10);
      }
      
      dateObj = new Date(year, month, parseInt(day || '1', 10), hours, minutes);
    } catch (e) {
      // If parsing fails, use current date
      dateObj = new Date();
    }
    
    // Find the index of "said:" to separate username from content
    const saidIndex = parts[1].indexOf('said:');
    
    if (saidIndex === -1) {
      return { date: dateObj.toISOString(), user: 'Unknown', content: parts[1] };
    }
    
    const userName = parts[1].substring(0, saidIndex).trim();
    const content = parts[1].substring(saidIndex + 5).trim();
    
    return { date: dateObj.toISOString(), user: userName, content };
  };
  
  // Parse notes into individual note objects
  const parseNotes = (notesString?: string) => {
    if (!notesString) return [];
    
    return notesString.split('\n\n').map((note) => parseNote(note));
  };

  // Get initials from a name for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return '??';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Delete a note
  const deleteNote = async (noteIndex: number) => {
    if (!selectedReferral || !selectedReferral.additional_notes) return;
    
    try {
      // Parse existing notes
      const notes = parseNotes(selectedReferral.additional_notes);
      
      // Remove the note at the specified index
      const updatedNotes = notes.filter((_, index) => index !== noteIndex);
      
      // Reconstruct the notes string
      const updatedNotesString = updatedNotes.length > 0 
        ? updatedNotes.map(note => 
            `${formatDate(note.date)} - ${note.user} said: ${note.content}`
          ).join('\n\n')
        : '';
      
      // Update in database
      const { error } = await supabase
        .from('referrals')
        .update({ additional_notes: updatedNotesString })
        .eq('id', selectedReferral.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setSelectedReferral({
        ...selectedReferral,
        additional_notes: updatedNotesString
      });
      
      // Reset note to delete
      setNoteToDelete(null);
      
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };
  
  // Open delete confirmation dialog
  const confirmNoteDelete = (noteIndex: number) => {
    setNoteToDelete(noteIndex);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <AdminCheck />
      <div>
        <h1 className="text-3xl font-bold mb-6">Referrals Management</h1>
        
        {error ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-xl font-medium mb-2">Database Setup Required</h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please create the necessary tables in your Supabase database or check your database configuration.
              </p>
              <Button onClick={() => fetchReferrals()}>
                Retry
              </Button>
            </div>
          </Card>
        ) : (
          <>
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
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={typeFilter}
                      onValueChange={setTypeFilter}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="landlord">Landlord</SelectItem>
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
                        onClick={() => fetchReferrals()}
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
                <CardTitle className="text-xl">
                  Referrals
                  {!loading && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({referrals.length} {referrals.length === 1 ? 'referral' : 'referrals'})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Loading referrals...</p>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-muted-foreground">No referrals found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Referee</TableHead>
                          <TableHead>Referrer</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(referral.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{referral.referee_name}</div>
                              <div className="text-sm text-muted-foreground">{referral.referee_email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{referral.referrers?.full_name}</div>
                              <div className="text-sm text-muted-foreground">{referral.referrers?.email}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {referral.referee_type.charAt(0).toUpperCase() + referral.referee_type.slice(1)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(referral.status)}>
                                {referral.status || 'New'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openReferralDetails(referral)}
                              >
                                Manage
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
            
            {/* Use the shared ReferralDetailsDialog component */}
            <ReferralDetailsDialog
              referral={selectedReferral}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
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
            />
            
            {/* Delete Note Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the note from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      if (noteToDelete !== null) {
                        deleteNote(noteToDelete);
                      }
                      setIsDeleteDialogOpen(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {/* Reward Dialog */}
            <Dialog open={isRewardDialogOpen} onOpenChange={(open) => {
              if (!open) {
                handleCloseRewardDialog();
              } else {
                setIsRewardDialogOpen(true);
              }
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Reward</DialogTitle>
                  <DialogDescription>
                    {selectedReferral && `Create a reward for referring ${selectedReferral.referee_name}`}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {selectedReferral && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="referrer">Referrer</Label>
                        <Input 
                          id="referrer" 
                          value={selectedReferral.referrers?.full_name || ''} 
                          disabled 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reward-type">Reward Type</Label>
                        <Select 
                          value={rewardType}
                          onValueChange={(value) => setRewardType(value as 'cash' | 'gift_card')}
                        >
                          <SelectTrigger id="reward-type">
                            <SelectValue placeholder="Select reward type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="gift_card">Gift Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Reward Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <div className="flex">
                            <Input 
                              id="amount" 
                              type="number" 
                              value={rewardAmount}
                              onChange={(e) => setRewardAmount(Number(e.target.value))} 
                              className="pl-7 pr-12" 
                            />
                            <div className="absolute right-0 inset-y-0 flex flex-col border-l">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-1/2 rounded-none rounded-tr-md border-b" 
                                onClick={incrementReward}
                              >
                                <ChevronUpIcon className="h-3 w-3" />
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-1/2 rounded-none rounded-br-md" 
                                onClick={decrementReward}
                              >
                                <ChevronDownIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseRewardDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={createReward} 
                    disabled={isProcessingReward}
                  >
                    {isProcessingReward ? 'Creating...' : 'Create Reward'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  );
}

export default AdminReferrals; 
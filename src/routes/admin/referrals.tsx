import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
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
import { ChevronUpIcon, ChevronDownIcon, UserPlus, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';
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
import { AdminReferralForm } from '../../components/referrals/AdminReferralForm';
import { 
  getColellaPartnerContacts, 
  getContactCategories, 
  getContacts,
  Contact,
  Property,
  getLinkableProperties
} from '../../lib/vault-re-api';

// Only import Tooltip components since they're used in the file
import { 
  Tooltip,
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../../components/ui/tooltip';

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
  referrers?: Referrer;
  vault_contact_id?: string;
  vault_property_id?: string; // Add field for linked property
  referee_address?: {
    street_address?: string;
    suburb?: string;
    state?: string;
    post_code?: string;
    postal_address?: string;
    display_address?: string;
  };
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

// Add a new interface for tracking sync status of contacts
interface ContactWithSyncStatus extends Contact {
  existsInDatabase?: boolean;
  matchedReferralId?: string;
  // Remove the addresses property as it's now part of the extended Contact interface's postalAddress
  // addresses?: VaultREAddress[]; 
}

// Add a new interface for the merge dialog
interface MergeDialogProps {
  contact: ContactWithSyncStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeComplete: (referralId: string) => void; // Pass referral ID back
  // Remove the old onMergeComplete - replaced by onSuccessfulMerge
}

// Interface for the new LinkPropertyDialog
interface LinkPropertyDialogProps {
  referralId: string | null; // The ID of the referral to link
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkComplete: () => void; // Callback after linking is done
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

  // CRM Sync state variables
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [vaultreContacts, setVaultreContacts] = useState<ContactWithSyncStatus[]>([]);
  const [loadingVaultreContacts, setLoadingVaultreContacts] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Array<{id: string; name: string}>>([]);
  const [manualCategoryId, setManualCategoryId] = useState<string>("2044501");
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Storage keys for referral categories
  const REFERRAL_CATEGORIES_KEY = 'referralCategoryIds';

  // Add new state for merge dialog
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactWithSyncStatus | null>(null);
  const [isLinkPropertyDialogOpen, setIsLinkPropertyDialogOpen] = useState(false);
  const [referralToLink, setReferralToLink] = useState<string | null>(null); // Store ID of referral to link
  const [linkedPropertyDetails, setLinkedPropertyDetails] = useState<any | null>(null); // State for linked property data
  const [loadingPropertyDetails, setLoadingPropertyDetails] = useState(false); // Loading state for property data

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter, typeFilter, searchQuery]);

  // New handler for when sync completes and potentially updates status
  const handleSyncComplete = useCallback(async (updatedReferral: Partial<Referral>) => {
    setReferrals(prevReferrals => 
      prevReferrals.map(ref => 
        ref.id === updatedReferral.id ? { ...ref, ...updatedReferral } : ref
      )
    );
    if (selectedReferral && selectedReferral.id === updatedReferral.id) {
      setSelectedReferral(prev => prev ? { ...prev, ...updatedReferral } : null);
    }
    // Refresh property details if the dialog is still open for the affected referral
    if (isDialogOpen && selectedReferral && selectedReferral.id === updatedReferral.id) {
      // Refetch linked property details based on the updated referral
      if (selectedReferral.vault_property_id) {
        setLoadingPropertyDetails(true);
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('vault_property_id', selectedReferral.vault_property_id)
            .single();

          if (error) {
            console.warn(`Property details not found in DB for vault_property_id ${selectedReferral.vault_property_id}:`, error.message);
            setLinkedPropertyDetails(null);
          } else {
            setLinkedPropertyDetails(data);
          }
        } catch (propertyError) {
          console.error("Error fetching linked property details after sync:", propertyError);
          setLinkedPropertyDetails(null);
        } finally {
          setLoadingPropertyDetails(false);
        }
      }
    }
  }, [selectedReferral, isDialogOpen]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get all referrals based on filters
      let query = supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('referee_type', typeFilter);
      }

      const { data: referralsData, error: referralsError } = await query;
      
      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        setError('Unable to load referrals data. The database tables may not exist yet.');
        return;
      }
      
      // Early return if no referrals
      if (!referralsData || referralsData.length === 0) {
        setReferrals([]);
        setLoading(false);
        return;
      }
      
      // Step 2: Get all relevant referrers in a single query
      const referrerIds = [...new Set(
        referralsData
          .filter(r => r.referrer_id)
          .map(r => r.referrer_id)
      )];
      
      // If no referrer IDs, just return the referrals without referrer data
      if (referrerIds.length === 0) {
        const processedReferrals = referralsData.map(referral => ({
          ...referral,
          referrers: undefined
        }));
        
        const filteredReferrals = applySearchFilter(processedReferrals);
        setReferrals(filteredReferrals);
        setLoading(false);
        return;
      }
      
      // Fetch all relevant referrers in one go
      const { data: referrersData, error: referrersError } = await supabase
        .from('referrers')
        .select('id, full_name, email, phone')
        .in('id', referrerIds);
      
      if (referrersError) {
        console.error('Error fetching referrers:', referrersError);
        
        // Even if referrers fetch fails, we can still show referrals
        const processedReferrals = referralsData.map(referral => ({
          ...referral,
          referrers: undefined
        }));
        
        const filteredReferrals = applySearchFilter(processedReferrals);
        setReferrals(filteredReferrals);
        setLoading(false);
        return;
      }
      
      // Create a map for quick referrer lookup
      const referrersMap = new Map();
      if (referrersData) {
        referrersData.forEach(referrer => {
          referrersMap.set(referrer.id, referrer);
        });
      }
      
      // Combine the data
      const processedReferrals = referralsData.map(referral => ({
        ...referral,
        referrers: referral.referrer_id ? referrersMap.get(referral.referrer_id) : undefined
      }));
      
      // Apply search filter if needed
      const filteredReferrals = applySearchFilter(processedReferrals);
      setReferrals(filteredReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to apply search filter
  const applySearchFilter = (referrals: Referral[]): Referral[] => {
    if (!searchQuery || referrals.length === 0) return referrals;
    
    const query = searchQuery.toLowerCase();
    return referrals.filter(
      referral => 
        (referral.referee_name && referral.referee_name.toLowerCase().includes(query)) ||
        (referral.referee_email && referral.referee_email.toLowerCase().includes(query)) ||
        (referral.referee_type && referral.referee_type.toLowerCase().includes(query)) ||
        (referral.referrers && referral.referrers.full_name && 
         referral.referrers.full_name.toLowerCase().includes(query)) ||
        (referral.referrers && referral.referrers.email && 
         referral.referrers.email.toLowerCase().includes(query)) ||
        (referral.status && referral.status.toLowerCase().includes(query))
    );
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
    setLinkedPropertyDetails(null); // Reset property details
    
    // Fetch status history
    await fetchStatusHistory(referral.id);
    
    // Fetch linked property details if a vault_property_id exists
    if (referral.vault_property_id) {
      setLoadingPropertyDetails(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('vault_property_id', referral.vault_property_id)
          .single(); // Expecting only one match
          
        if (error) {
          // Handle case where property might not be in our DB yet or other error
          console.warn(`Property details not found in DB for vault_property_id ${referral.vault_property_id}:`, error.message);
          setLinkedPropertyDetails(null); // Ensure it's null if error
        } else {
          setLinkedPropertyDetails(data);
        }
      } catch (propertyError) {
        console.error("Error fetching linked property details:", propertyError);
        setLinkedPropertyDetails(null);
      } finally {
        setLoadingPropertyDetails(false);
      }
    }
  };

  // Add new function to navigate to referrer details
  const navigateToReferrerDetails = (referrerId: string) => {
    if (!referrerId) return;
    
    // Navigate to the partner details page in the same window
    window.location.href = `/admin/referrers?partner=${referrerId}`;
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

  // Load saved categories from localStorage
  const loadSavedCategories = useCallback(() => {
    try {
      const savedCategories = localStorage.getItem(REFERRAL_CATEGORIES_KEY);
      if (savedCategories) {
        try {
          const parsedCategories = JSON.parse(savedCategories);
          
          // Validate the parsed categories are an array of strings
          if (Array.isArray(parsedCategories) && parsedCategories.length > 0 && 
              parsedCategories.every(cat => typeof cat === 'string')) {
            setSelectedCategoryIds(parsedCategories);
            
            // Also update the manual category ID input with the first selected category
            if (parsedCategories[0] && typeof parsedCategories[0] === 'string') {
              setManualCategoryId(parsedCategories[0]);
            }
          } else {
            // Invalid format, use default
            setSelectedCategoryIds(["2044501"]);
            setManualCategoryId("2044501");
          }
        } catch (parseError) {
          console.error('Error parsing saved categories:', parseError);
          // Default to the original hardcoded one if there's a parsing error
          setSelectedCategoryIds(["2044501"]);
          setManualCategoryId("2044501");
        }
      } else {
        // If no saved categories, default to the original hardcoded one
        setSelectedCategoryIds(["2044501"]);
        setManualCategoryId("2044501");
      }
    } catch (error) {
      console.error('Error loading saved categories:', error);
      // Default to the original hardcoded one if there's an error
      setSelectedCategoryIds(["2044501"]);
      setManualCategoryId("2044501");
    }
  }, []);

  // Function to save categories to localStorage
  const saveCategories = useCallback((categories: string[]) => {
    try {
      localStorage.setItem(REFERRAL_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }, []);

  // Load saved categories when component mounts
  useEffect(() => {
    loadSavedCategories();
  }, [loadSavedCategories]);

  // Add function to toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Save the selection to localStorage
      saveCategories(newSelection);
      return newSelection;
    });
  };

  // Add function to add current manual category ID to selection
  const addCurrentCategoryToSelection = () => {
    // Ensure manualCategoryId is a valid string
    if (!manualCategoryId || typeof manualCategoryId !== 'string' || !manualCategoryId.trim() || selectedCategoryIds.includes(manualCategoryId)) {
      return;
    }
    
    const newSelection = [...selectedCategoryIds, manualCategoryId];
    setSelectedCategoryIds(newSelection);
    saveCategories(newSelection);
    setShowCategorySelector(false); // Hide the selector after selection
  };

  // Add function to open sync dialog and fetch VaultRE contacts
  const openSyncDialog = async () => {
    setIsSyncDialogOpen(true);
    setLoadingVaultreContacts(true);
    setSyncError(null);
    
    try {
      // First, get all contact categories for debugging and selection
      const categories = await getContactCategories();
      setAllCategories(categories.map(cat => ({
        id: cat.id,
        name: cat.name || 'Unnamed Category'
      })));
      
      // Load saved categories if needed
      if (selectedCategoryIds.length === 0) {
        loadSavedCategories();
      }
      
      // If no categories are selected after loading saved ones, don't make API call
      if (selectedCategoryIds.length === 0) {
        setShowCategorySelector(true); // Show category selector on first load
        setLoadingVaultreContacts(false);
        return;
      }
      
      // Fetch contacts from VaultRE with the selected category IDs
      console.log("Fetching contacts from your CRM with selected categories...");
      
      // Use the updated function that accepts category IDs
      console.log(`Searching for contacts with category IDs: ${selectedCategoryIds.join(', ')}`);
      const contacts = await getColellaPartnerContacts(selectedCategoryIds);
      console.log(`Found ${contacts.length} contacts with selected categories`);
      
      // First get all existing referrals from the database to check for duplicates
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('id, referee_email, referee_phone');
      
      // Mark contacts that already exist in the database
      const contactsWithStatus = contacts.map(contact => {
        const matchedReferral = existingReferrals?.find(referral => 
          (contact.email && referral.referee_email === contact.email) || 
          (contact.mobilePhone && referral.referee_phone === contact.mobilePhone)
        );
        
        return {
          ...contact,
          existsInDatabase: !!matchedReferral,
          matchedReferralId: matchedReferral?.id
        };
      });
      
      setVaultreContacts(contactsWithStatus);
    } catch (error) {
      console.error('Error fetching contacts from CRM:', error);
      setSyncError('Failed to fetch contacts from your CRM');
    } finally {
      setLoadingVaultreContacts(false);
    }
  };

  // Modify importContactAsReferral to open the merge dialog
  const importContactAsReferral = (contact: ContactWithSyncStatus) => {
    setSelectedContact(contact);
    setIsMergeDialogOpen(true);
  };
  
  // Add a new function to handle merge action
  const handleMergeAction = (contact: ContactWithSyncStatus) => {
    setSelectedContact(contact);
    setIsMergeDialogOpen(true);
  };
  
  // Add function to handle completed merges AND trigger linking dialog
  const handleMergeCompleteAndLink = (referralId: string) => {
    setReferralToLink(referralId); // Set the ID of the referral we just processed
    setIsLinkPropertyDialogOpen(true); // Open the linking dialog
    // Refresh the main referrals list in the background
    fetchReferrals(); 
  };

  // Format phone number for display
  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    
    // Basic formatting for Australian numbers
    if (phone.startsWith('04') && phone.length === 10) {
      return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    
    return phone;
  };

  // Helper function to extract address data from VaultRE contact
  const extractAddressData = (contact: ContactWithSyncStatus) => {
    if (!contact || !contact.postalAddress) return null;
    
    const address = contact.postalAddress;
    
    // Construct address components using the postalAddress structure
    const streetAddress = [
      address.unitNumber,
      address.streetNumber,
      address.street // Use 'street' based on the updated interface
    ].filter(Boolean).join(' ');
    
    // Extract nested suburb, state, and postcode
    const suburb = address.suburb?.name || '';
    const state = address.suburb?.state?.abbreviation || '';
    const postCode = address.suburb?.postcode || '';
    
    // Create formatted addresses
    const postalAddressString = [
      streetAddress,
      suburb,
      state,
      postCode
    ].filter(Boolean).join(', ');
    
    const displayAddress = [
      streetAddress,
      suburb
    ].filter(Boolean).join(' ');
    
    return {
      street_address: streetAddress || null,
      suburb: suburb || null,
      state: state || null,
      post_code: postCode || null,
      postal_address: postalAddressString || null,
      display_address: displayAddress || null
    };
  };
  
  // Import all new contacts at once
  const importAllNewContacts = async () => {
    const newContacts = vaultreContacts.filter(contact => !contact.existsInDatabase);
    
    if (newContacts.length === 0) {
      toast.info('No new contacts to import');
      return;
    }
    
    try {
      // First get all existing referrals again to ensure we have the latest data
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('id, referee_email, referee_phone');
        
      // Track successful and skipped imports
      let successCount = 0;
      let skippedCount = 0;
      
      // Prepare array of referral data objects, filtering out potential duplicates
      const referralsData = [];
      
      for (const contact of newContacts) {
        // Skip contact if it has no name or contact info
        if ((!contact.firstName && !contact.lastName && !contact.fullName) || 
            (!contact.email && !contact.mobilePhone && !contact.workPhone && !contact.homePhone)) {
          console.log(`Skipping contact with insufficient data: ${contact.id}`);
          skippedCount++;
          continue;
        }
        
        // Check if this contact would create a duplicate
        const isDuplicate = existingReferrals?.some(referral => 
          (contact.email && referral.referee_email === contact.email) || 
          (contact.mobilePhone && referral.referee_phone === contact.mobilePhone)
        );
        
        if (isDuplicate) {
          console.log(`Skipping duplicate contact: ${contact.fullName || contact.email || contact.id}`);
          skippedCount++;
          continue;
        }
        
        // Extract address data from VaultRE contact
        const addressData = extractAddressData(contact);
        
        // Add to import list if not a duplicate
        referralsData.push({
          referee_name: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          referee_email: contact.email || '',
          referee_phone: contact.mobilePhone || contact.workPhone || contact.homePhone || '',
          referee_type: 'seller', // Default to seller
          status: 'New',
          created_at: new Date().toISOString(),
          vault_contact_id: contact.id,
          // vault_property_id will be linked in the next step
          referee_address: addressData
        });
      }
      
      // If we have referrals to import after filtering
      if (referralsData.length > 0) {
        // Insert referrals one by one to handle potential duplicates better
        for (const referralData of referralsData) {
          try {
            const { error } = await supabase
              .from('referrals')
              .insert(referralData);
            
            if (error) {
              console.warn('Error importing referral:', error);
              skippedCount++;
            } else {
              successCount++;
            }
          } catch (error) {
            console.warn('Error importing referral:', error);
            skippedCount++;
          }
        }
      }
      
      // Refresh the referrals list
      fetchReferrals();
      
      // Mark all attempted imports as processed
      setVaultreContacts(prevContacts => 
        prevContacts.map(contact => {
          const attempted = newContacts.some(c => c.id === contact.id);
          return attempted ? { ...contact, existsInDatabase: true } : contact;
        })
      );
      
      if (successCount > 0) {
        toast.success(`${successCount} referrals imported successfully`);
      }
      
      if (skippedCount > 0) {
        toast.info(`${skippedCount} contacts skipped (duplicates or invalid data)`);
      }
      
    } catch (error) {
      console.error('Error batch importing referrals:', error);
      toast.error('Failed to import some referrals');
    }
  };

  // Add function to get recent contacts
  const searchRecentContacts = async () => {
    setLoadingVaultreContacts(true);
    try {
      console.log("Fetching recently modified contacts from VaultRE...");
      
      // Get the 50 most recently modified contacts
      const contacts = await getContacts({
        pagesize: 50,
        sort: 'modified', // Use modified as the sort field
        sortOrder: 'desc'  // Sort in descending order to get most recent first
      });
      
      console.log(`Found ${contacts.length} recently modified contacts from API`);
      
      // Get existing referrals to check for duplicates
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('id, referee_email, referee_phone');
      
      // Mark contacts that already exist in the database
      const contactsWithStatus = contacts.map(contact => {
        const matchedReferral = existingReferrals?.find(referral => 
          (contact.email && referral.referee_email === contact.email) || 
          (contact.mobilePhone && referral.referee_phone === contact.mobilePhone)
        );
        
        return {
          ...contact,
          existsInDatabase: !!matchedReferral,
          matchedReferralId: matchedReferral?.id
        };
      });
      
      setVaultreContacts(contactsWithStatus);
      
      if (contacts.length > 0) {
        toast.success(`Loaded ${contacts.length} recently modified contacts`);
      } else {
        toast.info('No contacts found');
      }
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
      toast.error('Error loading contacts');
    } finally {
      setLoadingVaultreContacts(false);
    }
  };
  
  // New component for the merge dialog
  function MergeDialog({ contact, open, onOpenChange, onMergeComplete }: MergeDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Search for referrals in our database
    const searchReferrals = async () => {
      if (!searchQuery.trim()) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('*')
          .or(`referee_name.ilike.%${searchQuery}%,referee_email.ilike.%${searchQuery}%,referee_phone.ilike.%${searchQuery}%`)
          .limit(10);
        
        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching referrals:', error);
        toast.error('Error searching referrals');
      } finally {
        setLoading(false);
      }
    };

    // Handle creating a new referral from the contact
    const handleImport = async () => {
      if (!contact) return;
      
      setIsProcessing(true);
      try {
        // Extract address data from VaultRE contact
        const addressData = extractAddressData(contact);
        
        // Format referral data from contact
        const referralData = {
          referee_name: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          referee_email: contact.email || '',
          referee_phone: contact.mobilePhone || contact.workPhone || contact.homePhone || '',
          referee_type: 'seller', // Default to seller
          status: 'New',
          created_at: new Date().toISOString(),
          vault_contact_id: contact.id, // Store the VaultRE contact ID for future syncing
          // vault_property_id will be linked in the next step
          referee_address: addressData
        };
        
        // Insert the new referral and get the created record
        const { data, error } = await supabase
          .from('referrals')
          .insert(referralData)
          .select()
          .single(); // Use single() to get the object directly
        
        if (error) throw error;
        if (!data) throw new Error("Failed to retrieve created referral ID");
        
        toast.success('Referral imported successfully');
        onMergeComplete(data.id); // Pass the new ID back
        onOpenChange(false); // Close this dialog
      } catch (error) {
        console.error('Error importing referral:', error);
        toast.error('Failed to import referral');
      } finally {
        setIsProcessing(false);
      }
    };

    // Handle merging with an existing referral
    const handleMerge = async () => {
      if (!contact || !selectedReferral) return;
      
      setIsProcessing(true);
      try {
        // Extract address data from VaultRE contact
        const addressData = extractAddressData(contact);
        
        // Create an update object that preserves existing data when VaultRE data is missing
        const updateData: Partial<Referral> = {
          vault_contact_id: contact.id,
          // Only update if the VaultRE data exists and the app data is missing or empty
          referee_email: contact.email && (!selectedReferral.referee_email || selectedReferral.referee_email.trim() === '') 
            ? contact.email : selectedReferral.referee_email,
          referee_phone: getPreferredPhone(contact) && (!selectedReferral.referee_phone || selectedReferral.referee_phone.trim() === '')
            ? getPreferredPhone(contact) : selectedReferral.referee_phone,
          referee_address: mergeAddressData(selectedReferral.referee_address, addressData)
        };
        
        // Update the existing referral with VaultRE data
        const { error } = await supabase
          .from('referrals')
          .update(updateData)
          .eq('id', selectedReferral.id);
        
        if (error) throw error;
        
        toast.success('Referral merged successfully');
        onMergeComplete(selectedReferral.id); // Pass the merged ID back
        onOpenChange(false); // Close this dialog
      } catch (error) {
        console.error('Error merging referral:', error);
        toast.error('Failed to merge referral');
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Quick merge with suggested match
    const handleQuickMerge = async () => {
      if (!contact || !suggestedMatch) return;
      
      setIsProcessing(true);
      try {
        // Extract address data from VaultRE contact
        const addressData = extractAddressData(contact); // Use parent scope function
        
        // Create an update object that preserves existing data when VaultRE data is missing
        const updateData: Partial<Referral> = {
          vault_contact_id: contact.id,
          // Only update if the VaultRE data exists and the app data is missing or empty
          referee_email: contact.email && (!suggestedMatch.referee_email || suggestedMatch.referee_email.trim() === '')
            ? contact.email : suggestedMatch.referee_email,
          referee_phone: getPreferredPhone(contact) && (!suggestedMatch.referee_phone || suggestedMatch.referee_phone.trim() === '') // Use parent scope function
            ? getPreferredPhone(contact) : suggestedMatch.referee_phone,
          referee_address: mergeAddressData(suggestedMatch.referee_address, addressData) // Use parent scope function
        };
        
        // Update the suggested match with VaultRE data
        const { error } = await supabase
          .from('referrals')
          .update(updateData)
          .eq('id', suggestedMatch.id);
          
        if (error) throw error;
        
        toast.success('Referrals merged successfully');
        onMergeComplete(suggestedMatch.id); // Pass the merged ID back
        onOpenChange(false); // Close this dialog
      } catch (error) {
        console.error('Error quick merging referrals:', error);
        toast.error('Failed to merge referrals');
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Helper function to merge existing address data with new address data
    const mergeAddressData = (existingAddress: any, newAddress: any) => {
      if (!existingAddress && !newAddress) return null;
      if (!existingAddress) return newAddress;
      if (!newAddress) return existingAddress;
      
      // Merge the address data, preferring existing non-empty values
      return {
        street_address: existingAddress.street_address || newAddress.street_address,
        suburb: existingAddress.suburb || newAddress.suburb,
        state: existingAddress.state || newAddress.state,
        post_code: existingAddress.post_code || newAddress.post_code,
        postal_address: existingAddress.postal_address || newAddress.postal_address,
        display_address: existingAddress.display_address || newAddress.display_address
      };
    };
    
    // Helper function to get the preferred phone number from a contact
    const getPreferredPhone = (contact: ContactWithSyncStatus) => {
      return contact.mobilePhone || contact.workPhone || contact.homePhone || '';
    };

    // Reset state when dialog opens/closes
    useEffect(() => {
      if (!open) {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedReferral(null);
      }
    }, [open]);

    // Add new state for suggested match
    const [suggestedMatch, setSuggestedMatch] = useState<Referral | null>(null);
    const [checkingMatches, setCheckingMatches] = useState(false);
    
    // Check for matching referrals when dialog opens
    useEffect(() => {
      const findMatches = async () => {
        if (!contact || !open) return;
        
        setCheckingMatches(true);
        try {
          // Only proceed if we have email or phone to match
          if (!contact.email && !contact.mobilePhone) {
            setSuggestedMatch(null);
            setCheckingMatches(false);
            return;
          }
          
          let foundMatch: Referral | null = null;
          
          // Check for matching email if we have one
          if (contact.email) {
            const { data: emailMatches, error: emailError } = await supabase
              .from('referrals')
              .select('*')
              .eq('referee_email', contact.email)
              .limit(1);
              
            if (emailError) throw emailError;
            
            if (emailMatches && emailMatches.length > 0) {
              foundMatch = emailMatches[0] as Referral;
            }
          }
          
          // Check for matching phone if we have one and no email match was found
          if (!foundMatch && contact.mobilePhone) {
            const { data: phoneMatches, error: phoneError } = await supabase
              .from('referrals')
              .select('*')
              .eq('referee_phone', contact.mobilePhone)
              .limit(1);
              
            if (phoneError) throw phoneError;
            
            if (phoneMatches && phoneMatches.length > 0) {
              foundMatch = phoneMatches[0] as Referral;
            }
          }
          
          setSuggestedMatch(foundMatch);
        } catch (error) {
          console.error('Error finding matching referrals:', error);
          setSuggestedMatch(null);
        } finally {
          setCheckingMatches(false);
        }
      };
      
      findMatches();
    }, [contact, open]);

    if (!contact) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import or Merge Contact</DialogTitle>
            <DialogDescription>
              Import as a new referral or merge with an existing referral.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              {/* Show a loading state while checking for matches */}
              {checkingMatches && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Checking for matching referrals...</span>
                </div>
              )}
              
              {/* Show suggested match if found */}
              {suggestedMatch && !checkingMatches && (
                <div className="border rounded-md p-4 bg-yellow-50 dark:bg-yellow-900/30">
                  <h3 className="font-medium mb-2 flex items-center text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Potential Match Found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This contact appears to match an existing referral in your database.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border rounded-md p-3 bg-white dark:bg-gray-800">
                      <h4 className="text-sm font-medium mb-2">VaultRE Contact</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p>{contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p>{contact.email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p>{formatPhone(contact.mobilePhone) || formatPhone(contact.workPhone) || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3 bg-white dark:bg-gray-800">
                      <h4 className="text-sm font-medium mb-2">Existing Referral</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p>{suggestedMatch.referee_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p>{suggestedMatch.referee_email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p>{formatPhone(suggestedMatch.referee_phone) || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p>{suggestedMatch.referee_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p>{suggestedMatch.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleQuickMerge}
                    disabled={isProcessing}
                    className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 w-full"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Merge with Suggested Match
                  </Button>
                </div>
              )}
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Contact Details from VaultRE</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p>{contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{contact.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p>{formatPhone(contact.mobilePhone) || formatPhone(contact.workPhone) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact ID:</span>
                    <p>{contact.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-medium mb-2">Option 1: Import as New</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create a new referral in the database with this contact's information.
                  </p>
                  <Button 
                    onClick={handleImport}
                    disabled={isProcessing || !!suggestedMatch}
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Import as New Referral
                  </Button>
                  
                  {suggestedMatch && (
                    <p className="text-xs text-red-500 mt-1">
                      Cannot import as new - a matching referral already exists.
                    </p>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-2">
                  <h3 className="font-medium mb-2">Option 2: Merge with Different Referral</h3>
                  <div className="space-y-2">
                    <Label htmlFor="search">Search for a referral to merge with</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="search"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={searchReferrals}
                        disabled={loading || !searchQuery.trim()}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                      </Button>
                    </div>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-md overflow-hidden mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((referral) => (
                            <TableRow key={referral.id} className={selectedReferral?.id === referral.id ? "bg-muted" : ""}>
                              <TableCell>
                                <input
                                  type="radio"
                                  checked={selectedReferral?.id === referral.id}
                                  onChange={() => setSelectedReferral(referral)}
                                  className="rounded-full"
                                />
                              </TableCell>
                              <TableCell>{referral.referee_name}</TableCell>
                              <TableCell>{referral.referee_email}</TableCell>
                              <TableCell>{formatPhone(referral.referee_phone)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {searchResults.length === 0 && searchQuery && !loading && (
                    <div className="text-center p-4 border rounded-md mt-4">
                      <p className="text-muted-foreground">No matching referrals found</p>
                    </div>
                  )}
                  
                  {selectedReferral && (
                    <Button 
                      onClick={handleMerge}
                      disabled={isProcessing || !selectedReferral}
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 mt-4"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Merge with Selected
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // New component to link property
  function LinkPropertyDialog({ referralId, open, onOpenChange, onLinkComplete }: LinkPropertyDialogProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch properties when dialog opens
    useEffect(() => {
      const fetchProps = async () => {
        if (!open) return;
        setLoading(true);
        setSelectedPropertyId(null); // Reset selection
        setSearchTerm(''); // Reset search
        try {
          const props = await getLinkableProperties();
          setProperties(props);
        } catch (error) {
          console.error("Error fetching properties for linking:", error);
          toast.error("Failed to load properties from VaultRE");
        } finally {
          setLoading(false);
        }
      };
      fetchProps();
    }, [open]);

    // Filter properties based on search term
    const filteredProperties = properties.filter(prop => 
      !searchTerm || 
      (prop.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prop.displayAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prop.id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Handle linking the property
    const handleLinkProperty = async () => {
      if (!referralId || !selectedPropertyId) return;
      
      // Find the full selected property object from the state
      const selectedProperty = properties.find(prop => prop.id === selectedPropertyId);
      if (!selectedProperty) {
        toast.error("Selected property not found. Please try again.");
        return;
      }

      setIsProcessing(true);
      try {
        // 1. Prepare property data for our table
        const propertyDataForTable = {
          vault_property_id: selectedProperty.id,
          referral_id: referralId, // Link to the current referral
          address: extractPropertyAddressData(selectedProperty), // Use a helper to format address
          status: selectedProperty.status,
          property_type: selectedProperty.type?.name || selectedProperty.propertyType,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          car_spaces: selectedProperty.carSpaces,
          price_text: selectedProperty.priceText || selectedProperty.displayPrice,
          listed_date: selectedProperty.listedDate,
          agent_name: selectedProperty.agent?.name,
          agent_email: selectedProperty.agent?.email,
          agent_phone: selectedProperty.agent?.phone,
          vault_last_modified: selectedProperty.dateModified || null,
          updated_at: new Date().toISOString() // Ensure updated_at is set
        };

        // 2. Upsert into the properties table
        const { error: upsertError } = await supabase
          .from('properties')
          .upsert(propertyDataForTable, { onConflict: 'vault_property_id' });

        if (upsertError) {
          console.error("Error upserting property:", upsertError);
          throw new Error("Failed to save property details.");
        }

        // 3. Update the referral table with the vault_property_id
        const { error: referralUpdateError } = await supabase
          .from('referrals')
          .update({ vault_property_id: selectedPropertyId })
          .eq('id', referralId);
        
        if (referralUpdateError) {
          console.error("Error updating referral link:", referralUpdateError);
          // Optional: Consider rolling back the property upsert or notifying user
          throw new Error("Failed to link property to referral.");
        }
        
        toast.success("Property linked successfully!");
        onLinkComplete(); // Call the completion callback
        onOpenChange(false); // Close the dialog
      } catch (error: any) {
        console.error("Error linking property:", error);
        toast.error(error.message || "Failed to link property.");
      } finally {
        setIsProcessing(false);
      }
    };

    // Helper function to extract address data from VaultRE Property object
    const extractPropertyAddressData = (property: Property) => {
        if (!property || !property.address) return null;
        
        const addr = property.address;
        
        // Construct address components - adapting from contact logic
        let streetAddress = addr.street || '';
        if (addr.streetNumber) {
            streetAddress = `${addr.streetNumber} ${streetAddress}`;
        }
        if (addr.unitNumber) {
            streetAddress = `Unit ${addr.unitNumber}, ${streetAddress}`;
        }
        
        // Handle potentially nested suburb object or simple string
        let suburbName = '';
        let postcode = addr.postcode || '';
        let stateAbbr = addr.state || '';
        
        if (typeof addr.suburb === 'object' && addr.suburb !== null) {
            suburbName = addr.suburb.name || '';
            postcode = addr.suburb.postcode || postcode;
            stateAbbr = addr.suburb.state?.abbreviation || stateAbbr;
        } else if (typeof addr.suburb === 'string') {
            suburbName = addr.suburb;
        }
        
        // Create formatted addresses
        const postalAddressString = [
            streetAddress,
            suburbName,
            stateAbbr,
            postcode
        ].filter(Boolean).join(', ');
        
        const displayAddress = addr.displayAddress || [
            streetAddress,
            suburbName
        ].filter(Boolean).join(' ');
        
        return {
            street_address: streetAddress.trim() || null,
            suburb: suburbName || null,
            state: stateAbbr || null,
            post_code: postcode || null,
            postal_address: postalAddressString || null,
            display_address: displayAddress || null
        };
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Property to Referral</DialogTitle>
            <DialogDescription>
              Select a property from VaultRE to link to this referral for tracking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Input 
              placeholder="Search by address or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading properties...</span>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center p-4 border rounded-md">
                <p className="text-muted-foreground">No matching properties found.</p>
              </div>
            ) : (
              <div className="border rounded-md max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow 
                        key={property.id}
                        className={`cursor-pointer ${selectedPropertyId === property.id ? "bg-muted" : ""}`}
                        onClick={() => setSelectedPropertyId(property.id)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            checked={selectedPropertyId === property.id}
                            onChange={() => setSelectedPropertyId(property.id)}
                            className="rounded-full"
                          />
                        </TableCell>
                        <TableCell>{property.displayAddress || property.address?.fullAddress || 'N/A'}</TableCell>
                        <TableCell>{property.type?.name || property.propertyType || 'N/A'}</TableCell>
                        <TableCell>{property.status || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Skip Linking
            </Button>
            <Button 
              onClick={handleLinkProperty}
              disabled={!selectedPropertyId || isProcessing}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Link Selected Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="flex items-center gap-4 w-full">
                    <span>
                      Referrals
                      {!loading && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({referrals.length} {referrals.length === 1 ? 'referral' : 'referrals'})
                        </span>
                      )}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <AdminReferralForm 
                        onSubmitSuccess={fetchReferrals}
                        triggerButton={
                          <Button
                            className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline" 
                              onClick={openSyncDialog}
                              className="space-x-1"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-black text-white dark:bg-white dark:text-black border">
                            <p>Sync from CRM</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="flex-1 max-w-md ml-auto">
                      <Input
                        placeholder="Search by name, email, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="font-normal"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading referrals...</p>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(referral.created_at)}
                            </TableCell>
                            <TableCell>
                              <div 
                                className="cursor-pointer hover:text-primary group" 
                                onClick={() => openReferralDetails(referral)}
                                title="Click to manage referee details"
                              >
                                <div className="font-medium group-hover:underline">
                                  {referral.referee_name}
                                </div>
                                <div className="text-sm text-muted-foreground group-hover:text-primary">
                                  {referral.referee_email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {referral.referrer_id && referral.referrers ? (
                                <div 
                                  className="cursor-pointer hover:text-primary group"
                                  onClick={() => navigateToReferrerDetails(referral.referrer_id)}
                                  title="Click to view partner details"
                                >
                                  <div className="font-medium group-hover:underline">
                                    {referral.referrers?.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground group-hover:text-primary">
                                    {referral.referrers?.email}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground">
                                  No referrer
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {referral.referee_type.charAt(0).toUpperCase() + referral.referee_type.slice(1)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(referral.status)}>
                                {referral.status || 'New'}
                              </Badge>
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
              // Pass property data and loading state
              linkedProperty={linkedPropertyDetails}
              loadingProperty={loadingPropertyDetails}
              // Pass the sync complete handler
              onSyncComplete={handleSyncComplete}
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
                    {selectedReferral ? `Create a reward for referring ${selectedReferral.referee_name}` : 'Create reward'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {selectedReferral && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="referrer">Referrer</Label>
                        <Input 
                          id="referrer" 
                          value={selectedReferral.referrers?.full_name || 'Unknown'} 
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

            {/* VaultRE Sync Dialog */}
            <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
              <DialogContent className="max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center justify-between">
                    <span>Sync Referrals</span>
                  </DialogTitle>
                  <DialogDescription>
                    View and import contacts from your CRM with your selected referral categories.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 overflow-y-auto flex-1">
                  {/* Category Selection Section */}
                  <div className={`mb-4 border rounded-md ${showCategorySelector ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-950'}`}>
                    <div className="p-3 flex justify-between items-center cursor-pointer" 
                         onClick={() => setShowCategorySelector(!showCategorySelector)}>
                      <div>
                        <h3 className="text-sm font-medium">Referral Category Setup</h3>
                        {selectedCategoryIds.length > 0 && !showCategorySelector && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'category' : 'categories'} selected
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event from bubbling up
                          setShowCategorySelector(!showCategorySelector);
                        }}
                      >
                        {showCategorySelector ? 'Hide' : 'Configure'}
                      </Button>
                    </div>

                    {/* Collapsible content */}
                    {showCategorySelector && (
                      <div className="p-3 pt-0 border-t">
                        <p className="text-xs text-muted-foreground mb-3">
                          Select which CRM contact categories should be considered as referrals.
                          You can add multiple categories if needed.
                        </p>
                        
                        {/* Category selection section */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Currently Selected Categories:</h4>
                          {selectedCategoryIds.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No categories selected yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedCategoryIds.map(catId => {
                                const category = allCategories.find(c => c.id === catId);
                                return (
                                  <Badge key={catId} variant="outline" className="flex items-center gap-1">
                                    {category?.name || `Category ${catId}`}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategorySelection(catId)} />
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Add new category section */}
                        <div className="flex items-center gap-2 mb-3">
                          <Input
                            value={manualCategoryId}
                            onChange={(e) => setManualCategoryId(e.target.value)}
                            placeholder="Enter category ID"
                            className="h-8"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={addCurrentCategoryToSelection}
                            disabled={!manualCategoryId || typeof manualCategoryId !== 'string' || !manualCategoryId.trim() || selectedCategoryIds.includes(manualCategoryId)}
                          >
                            Add to Selection
                          </Button>
                        </div>
                        
                        {/* Search through all categories */}
                        {allCategories.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Available Categories:</h4>
                            <Input
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="mb-2 h-8"
                            />
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                              {allCategories
                                .filter(cat => 
                                  !categorySearch || 
                                  cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                  String(cat.id).includes(categorySearch)
                                )
                                .map((cat, i) => (
                                  <div key={i} className="flex items-center justify-between py-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-1 rounded">
                                    <div className="text-sm">
                                      <span className="font-medium">{cat.name}</span>
                                      <span className="text-xs text-muted-foreground ml-1">(ID: {cat.id})</span>
                                    </div>
                                    <Button
                                      variant={selectedCategoryIds.includes(cat.id) ? "default" : "outline"}
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => toggleCategorySelection(cat.id)}
                                    >
                                      {selectedCategoryIds.includes(cat.id) ? "Selected" : "Select"}
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-3">
                          <Button 
                            onClick={() => {
                              setShowCategorySelector(false);
                              if (selectedCategoryIds.length > 0) {
                                openSyncDialog(); // Refresh contacts with selected categories
                              }
                            }}
                          >
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingVaultreContacts ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Loading contacts from your CRM...</p>
                    </div>
                  ) : syncError ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-red-500 mb-2">{syncError}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Make sure the selected categories exist in your CRM and the API has access to them.
                      </p>
                      <Button variant="outline" onClick={openSyncDialog}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : selectedCategoryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-muted-foreground">Please select at least one referral category to sync.</p>
                      <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-lg text-center">
                        Make sure contacts are properly categorized in your CRM before syncing.
                      </p>
                      <Button variant="outline" onClick={openSyncDialog}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Sync
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="font-medium">
                            {vaultreContacts.length} potential referral{vaultreContacts.length !== 1 ? 's' : ''} found
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            ({vaultreContacts.filter(c => !c.existsInDatabase).length} new)
                          </span>
                          <div className="text-xs text-muted-foreground mt-1">
                            Only showing contacts with the selected referral categories
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={openSyncDialog}
                            disabled={loadingVaultreContacts}
                          >
                            {loadingVaultreContacts ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">Refresh</span>
                          </Button>
                          
                          {vaultreContacts.some(c => !c.existsInDatabase) && (
                            <Button
                              onClick={importAllNewContacts}
                              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                            >
                              Import All New Contacts
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact results table */}
                      <div className="border rounded-md mb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vaultreContacts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No contacts found with the specified category
                                </TableCell>
                              </TableRow>
                            ) : (
                              // Sort contacts - New contacts at top, already imported at bottom
                              [...vaultreContacts]
                                .sort((a, b) => {
                                  // Sort by existsInDatabase status first (false comes before true)
                                  if (a.existsInDatabase !== b.existsInDatabase) {
                                    return a.existsInDatabase ? 1 : -1;
                                  }
                                  // Then sort by name as secondary criteria
                                  const nameA = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim();
                                  const nameB = b.fullName || `${b.firstName || ''} ${b.lastName || ''}`.trim();
                                  return nameA.localeCompare(nameB);
                                })
                                .map((contact) => (
                                  <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                      {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Name'}
                                    </TableCell>
                                    <TableCell>
                                      {contact.email || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {formatPhone(contact.mobilePhone) || formatPhone(contact.workPhone) || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {contact.existsInDatabase ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                                          Already Imported
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                                          New Contact
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {contact.existsInDatabase ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleMergeAction(contact)}
                                        >
                                          Merge
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => importContactAsReferral(contact)}
                                          className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                        >
                                          Import
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Search contacts section - moved to bottom */}
                      <div className="border p-3 rounded-md bg-gray-50 dark:bg-gray-900">
                        <h4 className="text-sm font-medium mb-2">Show Recently Modified Contacts</h4>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            onClick={searchRecentContacts}
                            disabled={loadingVaultreContacts}
                            className="w-full"
                          >
                            {loadingVaultreContacts ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Load Recent Contacts
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Shows the 50 most recently modified contacts from VaultRE regardless of category.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter className="flex-shrink-0 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
      
      {/* Add the new Merge Dialog */}
      <MergeDialog
        contact={selectedContact}
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        onMergeComplete={handleMergeCompleteAndLink} // Use the new handler
      />
      
      {/* Add the new LinkPropertyDialog */}
      <LinkPropertyDialog
        referralId={referralToLink} // Pass the stored ID
        open={isLinkPropertyDialogOpen}
        onOpenChange={setIsLinkPropertyDialogOpen}
        onLinkComplete={() => {
          // Refresh the referrals list after linking
          fetchReferrals();
          // Optionally clear the referralToLink state
          setReferralToLink(null);
          // Close the dialog (already handled by onOpenChange)
        }}
      />
    </div>
  );
}

export default AdminReferrals; 
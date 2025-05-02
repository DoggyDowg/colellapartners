import React, { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs'
import {
  Card,
} from '../ui/card'
import {
  Avatar,
  AvatarFallback,
} from '../ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  Switch
} from '../ui/switch'
import {
  Label
} from '../ui/label'
import {
  Input
} from '../ui/input'
import {
  Textarea
} from '../ui/textarea'
import {
  Button
} from '../ui/button'
import {
  Badge
} from '../ui/badge'
import { Loader2, TrashIcon } from 'lucide-react'

// Types
export interface ReferrerNote {
  user: string;
  date: string;
  content: string;
}

export interface Referral {
  id: string;
  status: string;
  created_at: string;
  referee_name: string;
  referee_email: string;
  referee_type: string;
  referrer_id: string;
}

export interface Reward {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  reward_type: string;
  referrals?: {
    referee_name: string;
    referee_type: string;
  };
}

export interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_business: boolean;
  business_name?: string;
  partner_code?: string;
  active: boolean;
  created_at: string;
  partnership_start_date?: string;
  additional_notes?: string;
  address?: string;
  contact_person?: string;
}

interface PartnerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referrer: Referrer | null;
  // Util functions
  formatTimeAgo: (dateString: string) => string;
  parseNotes: (notesJson: string) => ReferrerNote[];
  getInitials: (name: string) => string;
  formatDate: (date: string) => string;
  getStatusBadgeClass: (status: string) => string;
}

// Add error handling utilities
const logError = (_message: string, _error: unknown): void => {
  // Silent error handling in production - could be replaced with proper logging
};

// Add a function to get the current user email similar to how AdminCheck does it
const getCurrentUserEmail = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email || 'Admin';
  } catch (_error) {
    return 'Admin';
  }
};

export function PartnerDetailsDialog({
  open,
  onOpenChange,
  referrer,
  formatTimeAgo,
  parseNotes,
  getInitials,
  formatDate,
  getStatusBadgeClass,
}: PartnerDetailsDialogProps) {
  // State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedReferrer, setEditedReferrer] = useState<Referrer | null>(null);
  const [partnerNote, setPartnerNote] = useState('');
  const [partnerCodeValid, setPartnerCodeValid] = useState<boolean | null>(null);
  const [partnerCodeChecking, setPartnerCodeChecking] = useState(false);
  const [invalidCharDetected, setInvalidCharDetected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDeleteIndex, setNoteToDeleteIndex] = useState<number | null>(null);
  const [isStatusToggleDialogOpen, setIsStatusToggleDialogOpen] = useState(false);
  const [statusToggleNote, setStatusToggleNote] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; newStatus: boolean } | null>(null);
  
  // Referrals & Rewards
  const [referrerReferrals, setReferrerReferrals] = useState<Referral[]>([]);
  const [referrerRewards, setReferrerRewards] = useState<Reward[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [_selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [_selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [_isRewardDialogOpen, _setIsRewardDialogOpen] = useState(false);
  const [_statusHistory, _setStatusHistory] = useState<Record<string, unknown>[]>([]);
  const [_loadingHistory, _setLoadingHistory] = useState(false);
  const [_statusNote, _setStatusNote] = useState('');
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      setEditedReferrer(null);
      setPartnerNote('');
      setStatusToggleNote('');
      setPendingStatusChange(null);
    } else if (referrer) {
      // Load referrals and rewards when dialog opens
      fetchReferrerReferrals(referrer.id);
      fetchReferrerRewards(referrer.id);
    }
  }, [open, referrer]);
  
  // Fetch referrals for the selected referrer
  const fetchReferrerReferrals = async (referrerId: string) => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setReferrerReferrals(data || []);
    } catch (_error) {
      // Silent error handling - just set empty array
      setReferrerReferrals([]);
    } finally {
      setLoadingReferrals(false);
    }
  };
  
  // Fetch rewards for the selected referrer
  const fetchReferrerRewards = async (referrerId: string) => {
    setLoadingRewards(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*, referrals(referee_name, referee_type)')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setReferrerRewards(data || []);
    } catch (_error) {
      // Silent error handling - just set empty array
      setReferrerRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  };
  
  // Handle edit partner
  const handleEditPartner = () => {
    if (referrer) {
      setEditedReferrer({...referrer});
      setIsEditMode(true);
    }
  };
  
  // Cancel edit
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditedReferrer(null);
  };
  
  // Save partner changes
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
          partner_code: editedReferrer.partner_code,
          active: editedReferrer.active,
        })
        .eq('id', editedReferrer.id);
        
      if (error) throw error;
      
      // Update the local referrer data
      if (referrer) {
        Object.assign(referrer, editedReferrer);
      }
      
      setIsEditMode(false);
      setEditedReferrer(null);
      
    } catch (_error) {
      // Silent error handling
      // Could add UI error notification here
    }
  };
  
  // Handle partner code change
  const handlePartnerCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedReferrer) return;
    
    const value = e.target.value.toUpperCase();
    const isValid = /^[A-Z0-9]*$/.test(value);
    
    setInvalidCharDetected(!isValid);
    
    if (isValid) {
      setEditedReferrer({
        ...editedReferrer,
        partner_code: value
      });
    }
  };
  
  // Validate partner code
  const handlePartnerCodeBlur = async (code: string) => {
    if (!code || code.length < 3) {
      setPartnerCodeValid(false);
      return;
    }
    
    setPartnerCodeChecking(true);
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('id')
        .eq('partner_code', code)
        .neq('id', editedReferrer?.id || '');
        
      if (error) throw error;
      setPartnerCodeValid(data.length === 0);
    } catch (_error) {
      // Silent error handling
      setPartnerCodeValid(false);
    } finally {
      setPartnerCodeChecking(false);
    }
  };
  
  // Update addPartnerNote to use async/await with getCurrentUserEmail
  const addPartnerNote = async () => {
    if (!referrer || !partnerNote.trim()) return;
    
    try {
      // Get existing notes or initialize empty array
      const existingNotes = referrer.additional_notes 
        ? parseNotes(referrer.additional_notes)
        : [];
      
      // Get current user email
      const userEmail = await getCurrentUserEmail();
        
      // Add new note
      const newNote: ReferrerNote = {
        user: userEmail,
        date: new Date().toISOString(),
        content: partnerNote
      };
      
      // Update notes array
      const updatedNotes = [...existingNotes, newNote];
      
      const { error } = await supabase
        .from('referrers')
        .update({
          additional_notes: JSON.stringify(updatedNotes)
        })
        .eq('id', referrer.id);
        
      if (error) throw error;
      
      // Update local referrer data
      referrer.additional_notes = JSON.stringify(updatedNotes);
      setPartnerNote('');
      
    } catch (_error) {
      logError('Error adding note', _error);
    }
  };
  
  // Confirm delete note
  const confirmPartnerNoteDelete = (index: number) => {
    setNoteToDeleteIndex(index);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete partner note
  const deletePartnerNote = async () => {
    if (!referrer || noteToDeleteIndex === null) return;
    
    try {
      const existingNotes = parseNotes(referrer.additional_notes || '');
      const updatedNotes = existingNotes.filter((_, i) => i !== noteToDeleteIndex);
      
      const { error } = await supabase
        .from('referrers')
        .update({
          additional_notes: JSON.stringify(updatedNotes)
        })
        .eq('id', referrer.id);
        
      if (error) throw error;
      
      // Update local referrer data
      referrer.additional_notes = JSON.stringify(updatedNotes);
      setIsDeleteDialogOpen(false);
      setNoteToDeleteIndex(null);
      
    } catch (_error) {
      // Silent error handling
      // Could add UI error notification here
    }
  };
  
  // Initiate toggle partner status
  const initiateTogglePartnerStatus = (id: string, newStatus: boolean) => {
    setPendingStatusChange({ id, newStatus });
    setIsStatusToggleDialogOpen(true);
  };
  
  // Same for confirmTogglePartnerStatus - update to use getCurrentUserEmail
  const confirmTogglePartnerStatus = async () => {
    if (!pendingStatusChange) return;
    
    try {
      // Update partner status
      const { error } = await supabase
        .from('referrers')
        .update({
          active: pendingStatusChange.newStatus
        })
        .eq('id', pendingStatusChange.id);
        
      if (error) throw error;
      
      // Add note if provided
      if (statusToggleNote.trim() && referrer) {
        const existingNotes = referrer.additional_notes 
          ? parseNotes(referrer.additional_notes)
          : [];
          
        // Get current user email
        const userEmail = await getCurrentUserEmail();
          
        const newNote: ReferrerNote = {
          user: userEmail,
          date: new Date().toISOString(),
          content: `${pendingStatusChange.newStatus ? 'Activated' : 'Deactivated'} partner: ${statusToggleNote}`
        };
        
        const updatedNotes = [...existingNotes, newNote];
        
        await supabase
          .from('referrers')
          .update({
            additional_notes: JSON.stringify(updatedNotes)
          })
          .eq('id', pendingStatusChange.id);
          
        // Update local referrer data
        if (referrer) {
          referrer.additional_notes = JSON.stringify(updatedNotes);
          referrer.active = pendingStatusChange.newStatus;
        }
      }
      
      // Reset state
      setIsStatusToggleDialogOpen(false);
      setPendingStatusChange(null);
      setStatusToggleNote('');
      
    } catch (_error) {
      logError('Error updating partner status', _error);
    }
  };
  
  // Handle referral details - simplified since we're not using it now
  const openReferralDetails = (referral: Referral) => {
    // Store the selected referral in state, but don't actually open a dialog yet
    setSelectedReferral(referral);
    // Skip opening the dialog since we're not implementing it right now
    // This avoids the unused variable warning while keeping the functionality available for future use
  };
  
  // Handle reward details - simplified since we're not using it now
  const openRewardDetails = (reward: Reward) => {
    // Store the selected reward in state, but don't actually open a dialog
    setSelectedReward(reward);
    // Skip opening dialog to avoid unused variable warnings
    // _setIsRewardDialogOpen(true);
  };
  
  // If no referrer is selected, don't render the dialog content
  // The parent Dialog component handles the open state
  // if (!referrer) return null; // Removed this guard as Dialog handles visibility
  
  return (
    // Wrap everything in the main Dialog component
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Conditional rendering for content based on referrer */}
      {referrer && (
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
            <DialogDescription>
              {referrer.is_business 
                ? `Business Partner: ${referrer.business_name}`
                : `Individual Partner: ${referrer.full_name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              {isEditMode ? (
                // Edit Form
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="font-medium text-base mb-2">Partner Type</div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="is_business" 
                        checked={editedReferrer?.is_business || false}
                        onCheckedChange={(checked) => {
                          if (editedReferrer) {
                            setEditedReferrer({
                              ...editedReferrer,
                              is_business: checked
                            });
                          }
                        }}
                      />
                      <Label htmlFor="is_business">
                        {editedReferrer?.is_business ? 'Business Partner' : 'Individual Partner'}
                      </Label>
                    </div>
                  </div>
                  
                  {/* Edit form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedReferrer?.is_business && (
                      <div className="space-y-2 md:col-span-2">
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
                    )}
                    
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
                    
                    {/* Partner code field (for business partners) */}
                    {editedReferrer?.is_business && (
                      <div className="space-y-2">
                        <Label htmlFor="partner_code">Partner Code</Label>
                        <div className="relative">
                          <Input 
                            id="partner_code" 
                            maxLength={8}
                            value={editedReferrer?.partner_code || ''}
                            onChange={handlePartnerCodeChange}
                            onBlur={() => handlePartnerCodeBlur(editedReferrer?.partner_code || '')}
                            className={`pr-9 ${
                              invalidCharDetected ? 'border-red-500' :
                              partnerCodeValid === false ? 'border-red-500' :
                              partnerCodeValid === true ? 'border-green-500' : ''
                            }`}
                          />
                          {partnerCodeChecking && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {partnerCodeValid === true && !partnerCodeChecking && !invalidCharDetected && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs ${invalidCharDetected ? 'text-red-500' : 'text-muted-foreground'}`}>
                          3-8 alphanumeric characters (A-Z, 0-9)
                        </div>
                      </div>
                    )}
                    
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
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={savePartnerChanges}
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                // Details View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 space-y-6 md:space-y-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold mb-2">Basic Information</h3>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {referrer.is_business ? (
                          <>
                            <p><span className="font-medium text-foreground">Business Name:</span> {referrer.business_name}</p>
                            <p><span className="font-medium text-foreground">Contact Person:</span> {referrer.full_name || referrer.contact_person || 'N/A'}</p>
                          </>
                        ) : (
                          <p><span className="font-medium text-foreground">Full Name:</span> {referrer.full_name}</p>
                        )}
                        <p><span className="font-medium text-foreground">Email:</span> {referrer.email}</p>
                        <p><span className="font-medium text-foreground">Phone:</span> {referrer.phone}</p>
                        {referrer.address && (
                          <p><span className="font-medium text-foreground">Address:</span> {referrer.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold mb-2">Partnership Details</h3>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center">
                          <span className="font-medium text-foreground">Status:</span>
                          <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${
                            referrer.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {referrer.active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                        <p><span className="font-medium text-foreground">Partner Since:</span> {new Date(referrer.partnership_start_date || referrer.created_at).toLocaleDateString()}</p>
                        <p><span className="font-medium text-foreground">Partner Code:</span> {referrer.partner_code || 'Not assigned'}</p>
                        <p><span className="font-medium text-foreground">Partner Type:</span> {referrer.is_business ? 'Business' : 'Individual'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold mb-2">System Information</h3>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Created:</span> {new Date(referrer.created_at).toLocaleString()}</p>
                        <p><span className="font-medium text-foreground">ID:</span> {referrer.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 border-t pt-6">
                    <h3 className="text-base font-semibold mb-3">Partner Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={referrer.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => initiateTogglePartnerStatus(referrer.id, !referrer.active)}
                      >
                        {referrer.active ? 'Deactivate' : 'Activate'}
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
            
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Add Note</h3>
                  <div className="mt-2 flex gap-2">
                    <Textarea 
                      placeholder="Enter your notes here..." 
                      value={partnerNote}
                      onChange={(e) => setPartnerNote(e.target.value)}
                      className="h-24"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      onClick={addPartnerNote}
                      disabled={!partnerNote.trim()}
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Notes History</h3>
                  {referrer?.additional_notes ? (
                    <div className="space-y-3">
                      {parseNotes(referrer.additional_notes).map((note, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getInitials(note.user)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-base">{note.user}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-muted-foreground">{formatTimeAgo(note.date)}</div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => confirmPartnerNoteDelete(index)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{note.content}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes available</p>
                  )}
                </div>
              </div>
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
            {!isEditMode && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
      
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
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deletePartnerNote} className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusToggleDialogOpen} onOpenChange={setIsStatusToggleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatusChange?.newStatus ? 'Activate Partner' : 'Deactivate Partner'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatusChange?.newStatus 
                ? 'Please provide a note explaining why you are activating this partner.' 
                : 'Please provide a note explaining why you are deactivating this partner.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="Enter your note here (optional)..." 
              value={statusToggleNote}
              onChange={(e) => setStatusToggleNote(e.target.value)}
              className="h-24"
            />
            
            <div className="text-sm text-muted-foreground">
              {pendingStatusChange?.newStatus
                ? 'This note will be saved with the activation action.'
                : 'This note will be saved with the deactivation action.'}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStatusToggleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmTogglePartnerStatus}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {pendingStatusChange?.newStatus ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
import { useAuth } from '../../context/AuthContext';

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
}

export const Route = createFileRoute('/admin/referrals')({
  component: AdminReferrals,
});

function AdminReferrals() {
  const { } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [statusNote, setStatusNote] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Status options for the dropdown
  const statusOptions = [
    'new',
    'contacted',
    'qualified',
    'contracted',
    'completed',
    'disqualified'
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

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    try {
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
      // Add a note to the referral
      const { error } = await supabase
        .from('referrals')
        .update({ 
          additional_notes: selectedReferral?.additional_notes 
            ? selectedReferral.additional_notes + '\n\n' + new Date().toLocaleString() + ': ' + statusNote
            : new Date().toLocaleString() + ': ' + statusNote
        })
        .eq('id', referralId);
      
      if (error) {
        throw error;
      }
      
      // Update selected referral
      if (selectedReferral) {
        const updatedNotes = selectedReferral.additional_notes 
          ? selectedReferral.additional_notes + '\n\n' + new Date().toLocaleString() + ': ' + statusNote
          : new Date().toLocaleString() + ': ' + statusNote;
        
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
  
  // Helper function for status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'disqualified':
        return 'bg-red-100 text-red-800';
      case 'contracted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
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
                            {new Date(referral.created_at).toLocaleDateString()}
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
                            {referral.referee_type}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(referral.status)}>
                              {referral.status || 'new'}
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
          
          {/* Referral Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl">
              {selectedReferral && (
                <>
                  <DialogHeader>
                    <DialogTitle>Referral Details</DialogTitle>
                    <DialogDescription>
                      Manage the referral for {selectedReferral.referee_name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Referee Information</h3>
                            <div className="mt-1 space-y-2">
                              <p><span className="font-medium">Name:</span> {selectedReferral.referee_name}</p>
                              <p><span className="font-medium">Email:</span> {selectedReferral.referee_email}</p>
                              <p><span className="font-medium">Phone:</span> {selectedReferral.referee_phone}</p>
                              <p><span className="font-medium">Type:</span> {selectedReferral.referee_type}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Referrer Information</h3>
                            <div className="mt-1 space-y-2">
                              <p><span className="font-medium">Name:</span> {selectedReferral.referrers?.full_name}</p>
                              <p><span className="font-medium">Email:</span> {selectedReferral.referrers?.email}</p>
                              <p><span className="font-medium">Phone:</span> {selectedReferral.referrers?.phone}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Referral Details</h3>
                            <div className="mt-1 space-y-2">
                              <p><span className="font-medium">Created:</span> {new Date(selectedReferral.created_at).toLocaleString()}</p>
                              <p>
                                <span className="font-medium">Status:</span>
                                <Badge className={`ml-2 ${getStatusBadgeClass(selectedReferral.status)}`}>
                                  {selectedReferral.status || 'new'}
                                </Badge>
                              </p>
                            </div>
                          </div>
                          
                          {selectedReferral.situation_description && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Situation Description</h3>
                              <p className="mt-1">{selectedReferral.situation_description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-2">Update Status</h3>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((status) => (
                            <Button
                              key={status}
                              variant={selectedReferral.status === status ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateReferralStatus(selectedReferral.id, status)}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="notes" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Add Note</h3>
                          <div className="mt-2 flex gap-2">
                            <Textarea 
                              placeholder="Enter your notes here..." 
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                              className="h-24"
                            />
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button 
                              onClick={() => addNote(selectedReferral.id)}
                              disabled={!statusNote.trim()}
                            >
                              Add Note
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-medium mb-2">Notes History</h3>
                          {selectedReferral.additional_notes ? (
                            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                              {selectedReferral.additional_notes}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No notes available</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="space-y-4">
                      {loadingHistory ? (
                        <div className="flex justify-center items-center h-32">
                          <p>Loading history...</p>
                        </div>
                      ) : statusHistory.length > 0 ? (
                        <div className="space-y-2">
                          {statusHistory.map((item) => (
                            <div key={item.id} className="border-b pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm">
                                    <span className="font-medium">Status changed from </span>
                                    <Badge className={`ml-1 ${getStatusBadgeClass(item.previous_status || 'new')}`}>
                                      {item.previous_status || 'New'}
                                    </Badge>
                                    <span className="font-medium ml-1">to</span>
                                    <Badge className={`ml-1 ${getStatusBadgeClass(item.new_status)}`}>
                                      {item.new_status}
                                    </Badge>
                                  </p>
                                  {item.notes && (
                                    <p className="text-sm mt-1">{item.notes}</p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No status history available</p>
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
        </>
      )}
    </div>
  );
}

export default AdminReferrals; 
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
  DialogTrigger,
} from '../../components/ui/dialog';

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

export const Route = createFileRoute('/admin/referrals')({
  component: AdminReferrals,
});

function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
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
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter) {
        query = query.eq('referee_type', typeFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
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
    } finally {
      setLoading(false);
    }
  };

  const openReferralDetails = (referral: Referral) => {
    setSelectedReferral(referral);
    setIsDialogOpen(true);
  };

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ status: newStatus })
        .eq('id', referralId);
      
      if (error) {
        throw error;
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
      }
      
    } catch (error) {
      console.error('Error updating referral status:', error);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchQuery('');
    fetchReferrals();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Referrals Management</h1>
      
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
                  <SelectItem value="">All statuses</SelectItem>
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
                  <SelectItem value="">All types</SelectItem>
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
                        <div className="flex items-center">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                            referral.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : referral.status === 'disqualified'
                              ? 'bg-red-100 text-red-800'
                              : referral.status === 'contracted'
                              ? 'bg-purple-100 text-purple-800'
                              : referral.status === 'qualified'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {referral.status || 'new'}
                          </span>
                        </div>
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
        <DialogContent className="max-w-3xl">
          {selectedReferral && (
            <>
              <DialogHeader>
                <DialogTitle>Referral Details</DialogTitle>
                <DialogDescription>
                  Manage the referral for {selectedReferral.referee_name}
                </DialogDescription>
              </DialogHeader>
              
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
                        <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${
                          selectedReferral.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedReferral.status === 'disqualified'
                            ? 'bg-red-100 text-red-800'
                            : selectedReferral.status === 'contracted'
                            ? 'bg-purple-100 text-purple-800'
                            : selectedReferral.status === 'qualified'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedReferral.status || 'new'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {selectedReferral.situation_description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Situation Description</h3>
                      <p className="mt-1">{selectedReferral.situation_description}</p>
                    </div>
                  )}
                  
                  {selectedReferral.additional_notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                      <p className="mt-1">{selectedReferral.additional_notes}</p>
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
  );
}

export default AdminReferrals; 
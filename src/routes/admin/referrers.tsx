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

export const Route = createFileRoute('/admin/referrers')({
  component: AdminReferrers,
});

function AdminReferrers() {
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [businessFilter, setBusinessFilter] = useState<boolean | null>(null);

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

  const openReferrerDetails = (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setIsDialogOpen(true);
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
        <DialogContent className="max-w-3xl">
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
              </div>
              
              <div className="border-t pt-4">
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
                    onClick={() => alert('Edit partner functionality to be implemented')}
                  >
                    Edit Partner
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('View partner referrals functionality to be implemented')}
                  >
                    View Referrals
                  </Button>
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

export default AdminReferrers; 
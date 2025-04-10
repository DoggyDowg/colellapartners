import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Input } from '../../../components/ui/input';
import { IconSearch } from '@tabler/icons-react';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

// Define interfaces for our data
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

export const Route = createFileRoute('/_authenticated/referrals/')({
  component: UserReferrals,
});

function UserReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [completedReferrals, setCompletedReferrals] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Apply search filter when searchQuery changes
  useEffect(() => {
    if (referrals.length > 0 && searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = referrals.filter(
        referral => 
          referral.referee_name.toLowerCase().includes(query) ||
          referral.referee_email.toLowerCase().includes(query) ||
          referral.referee_type.toLowerCase().includes(query) ||
          referral.status.toLowerCase().includes(query)
      );
      setFilteredReferrals(filtered);
    } else {
      setFilteredReferrals(referrals);
    }
  }, [referrals, searchQuery]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the known working ID, replace with user.id when fixed
      const hardcodedId = '7e4b6261-8037-4136-8119-2944dc9453ff';
      
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', hardcodedId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching referrals:', error);
        setError(`Error fetching referrals: ${error.message}`);
        return;
      }
      
      if (data) {
        const referralData = data as unknown as Referral[];
        setReferrals(referralData);
        setFilteredReferrals(referralData);
        
        // Calculate statistics
        setTotalReferrals(referralData.length);
        
        // Count completed and pending referrals
        const completed = referralData.filter(ref => 
          ['Signed Up', 'Settled'].includes(ref.status)).length;
        
        setCompletedReferrals(completed);
        setPendingReferrals(referralData.length - completed);
      } else {
        setReferrals([]);
        setFilteredReferrals([]);
      }
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      setError('An unexpected error occurred when fetching referrals.');
      toast.error('Failed to load your referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (referralId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching status history:', error);
        return;
      }
      
      setStatusHistory(data || []);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRefresh = () => {
    fetchReferrals();
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'new') return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    if (statusLower === 'contacted') return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    if (statusLower === 'signed up' || statusLower === 'settled') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (statusLower === 'ineligible') return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (statusLower === 'appraised' || statusLower === 'listed' || statusLower === 'sold') return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (error) {
    return (
      <>
        <Header title="My Referrals" />
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">My Referrals</h1>
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-xl font-medium mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please try again later.
              </p>
              <Button onClick={fetchReferrals}>
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
      <Header title="My Referrals" />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Referrals</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReferrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReferrals}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              Referrals History
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredReferrals.length} {filteredReferrals.length === 1 ? 'referral' : 'referrals'})
                </span>
              )}
            </CardTitle>
            <div className="relative w-full max-w-sm">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search referrals..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading referrals...</p>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No matching referrals found' : 'No referrals found'}
                </p>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div>{new Date(referral.created_at).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{referral.referee_name}</div>
                          <div className="text-sm text-muted-foreground">{referral.referee_email}</div>
                        </TableCell>
                        <TableCell>
                          {referral.referee_type.charAt(0).toUpperCase() + referral.referee_type.slice(1)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(referral.status)}>
                            {referral.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openReferralDetails(referral)}
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
        
        {/* Referral Details Dialog */}
        {selectedReferral && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Referral Details</DialogTitle>
                <DialogDescription>
                  Details for {selectedReferral.referee_name}'s referral
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">Status History</TabsTrigger>
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
                          <p><span className="font-medium">Type:</span> {selectedReferral.referee_type.charAt(0).toUpperCase() + selectedReferral.referee_type.slice(1)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Referral Details</h3>
                        <div className="mt-1 space-y-2">
                          <p><span className="font-medium">Created:</span> {formatDate(selectedReferral.created_at)}</p>
                          <p>
                            <span className="font-medium">Status:</span>
                            <Badge className={`ml-2 ${getStatusBadgeClass(selectedReferral.status)}`}>
                              {selectedReferral.status}
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
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  {loadingHistory ? (
                    <div className="flex justify-center items-center h-40">
                      <p>Loading history...</p>
                    </div>
                  ) : statusHistory.length === 0 ? (
                    <div className="flex justify-center items-center h-20">
                      <p className="text-muted-foreground">No status history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {statusHistory.map((historyItem) => (
                        <Card key={historyItem.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  Status changed to <Badge className={getStatusBadgeClass(historyItem.new_status)}>{historyItem.new_status}</Badge>
                                </div>
                                {historyItem.previous_status && (
                                  <div className="text-sm text-muted-foreground">
                                    Previous status: {historyItem.previous_status}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(historyItem.created_at)}
                              </div>
                            </div>
                            {historyItem.notes && (
                              <div className="mt-2 text-sm">
                                <div className="font-medium">Notes:</div>
                                <div className="text-muted-foreground">{historyItem.notes}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
} 
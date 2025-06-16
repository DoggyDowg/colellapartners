import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
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
import { Input } from '../../../components/ui/input';
import { IconSearch } from '@tabler/icons-react';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ErrorState } from '../../../components/ui/error-state';
import { handleError } from '../../../utils/error-handler';
import { PartnerReferralForm } from '../../../components/referrals/PartnerReferralForm';
import { Loader2 } from 'lucide-react';
import { ReferralsPartnerSetupPrompt } from '../../../components/referrals/ReferralsPartnerSetupPrompt';

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
  const { user: authUser } = useAuth();
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
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authUser || !authUser.id) {
        const errorMessage = handleError(new Error("Authentication required"), {
          context: 'UserReferrals.fetchReferrals',
          toastMessage: 'Please log in to view your referrals',
          showToast: false
        });
        setError(errorMessage);
        return;
      }

      // First, get the current user's referrer record
      let referrerId: string | null = null;
      
      // Check if user has a referrer record
      const { data: referrerData, error: referrerError } = await supabase
        .from('referrers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();
      
      if (referrerError) {
        if (referrerError.code === 'PGRST116') {
          // No partner record found - show setup prompt
          setShowSetupPrompt(true);
          setReferrals([]);
          setFilteredReferrals([]);
          setTotalReferrals(0);
          setCompletedReferrals(0);
          setPendingReferrals(0);
          setLoading(false);
          return;
        } else {
          // Other error
          const errorMessage = handleError(referrerError, {
            context: 'UserReferrals.fetchReferrals',
            toastMessage: 'Error fetching your referrer profile',
            showToast: false
          });
          setError(errorMessage);
          return;
        }
      }
      
      if (referrerData) {
        // Use the existing referrer ID
        referrerId = referrerData.id;
        setShowSetupPrompt(false);
      }
      
      // Now fetch referrals with the correct referrer ID
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        const errorMessage = handleError(error, {
          context: 'UserReferrals.fetchReferrals',
          toastMessage: 'Error fetching referrals',
          showToast: false // We'll handle this with the ErrorState component
        });
        setError(errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = handleError(error, {
        context: 'UserReferrals.fetchReferrals',
        toastMessage: 'Failed to load your referrals',
        showToast: true
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleSetupComplete = () => {
    setShowSetupPrompt(false);
    fetchReferrals();
  };

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

  const fetchStatusHistory = async (referralId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('referral_status_history')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });
      
      if (error) {
        handleError(error, {
          context: 'UserReferrals.fetchStatusHistory',
          toastMessage: 'Error fetching status history',
          showToast: true
        });
        return;
      }
      
      setStatusHistory(data || []);
    } catch (error: unknown) {
      handleError(error, {
        context: 'UserReferrals.fetchStatusHistory',
        toastMessage: 'Error fetching status history',
        showToast: true
      });
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

  // Add this new EmptyReferralsState component
  const EmptyReferralsState = () => (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <img 
          src="/images/empty-folder.png" 
          alt="Empty folder" 
          className="mb-4 opacity-70 w-16 h-16"
        />
        <h3 className="text-xl font-semibold mb-2">No referrals yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          When you make a referral, you'll be able to track it here. Let's get started by referring your first client.
        </p>
        <PartnerReferralForm onSubmitSuccess={fetchReferrals} />
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Header title="My Referrals" />
        <div className="container py-6">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading referrals...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header title="My Referrals" />
        <div className="container py-6">
          <ErrorState 
            message={error}
            onRetry={handleRefresh}
          />
        </div>
      </>
    )
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
        
        {(referrals.length > 0 || loading) ? (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
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
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedReferrals}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingReferrals}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Referrals</CardTitle>
                  <div className="relative w-64">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search referrals..."
                      className="pl-8 w-full bg-background"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <p>Loading referrals...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Referred On</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No matching referrals found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReferrals.map(referral => (
                            <TableRow key={referral.id}>
                              <TableCell className="font-medium">
                                {referral.referee_name}
                              </TableCell>
                              <TableCell>
                                {referral.referee_type === 'seller' ? 'Seller' : 'Landlord'}
                              </TableCell>
                              <TableCell>
                                {new Date(referral.created_at).toLocaleDateString()}
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
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyReferralsState />
        )}
        
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
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Referral Details</h3>
                        <div className="mt-1 space-y-2">
                          <p><span className="font-medium">Status:</span> <Badge className={getStatusBadgeClass(selectedReferral.status)}>{selectedReferral.status}</Badge></p>
                          <p><span className="font-medium">Created:</span> {formatDate(selectedReferral.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedReferral.situation_description && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Situation Description</h3>
                          <p className="mt-1 text-sm">{selectedReferral.situation_description}</p>
                        </div>
                      )}
                      
                      {selectedReferral.additional_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                          <p className="mt-1 text-sm">{selectedReferral.additional_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <div className="py-4">
                    <h3 className="text-lg font-medium mb-4">Status History</h3>
                    
                    {loadingHistory ? (
                      <div className="flex justify-center items-center py-8">
                        <p>Loading status history...</p>
                      </div>
                    ) : statusHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No status history available</p>
                    ) : (
                      <div className="space-y-4">
                        {statusHistory.map((item, _index) => (
                          <div key={item.id} className="border-l-2 border-muted pl-4 relative">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-2 top-0"></div>
                            <div className="pb-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                  Status changed to: <Badge className={getStatusBadgeClass(item.new_status)}>{item.new_status}</Badge>
                                </h4>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(item.created_at)}
                                </span>
                              </div>
                              {item.previous_status && (
                                <p className="text-sm text-muted-foreground">
                                  Previous status: {item.previous_status}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm mt-1">{item.notes}</p>
                              )}
                              {item.user_full_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Updated by: {item.user_full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Setup Prompt Dialog */}
      <ReferralsPartnerSetupPrompt
        isOpen={showSetupPrompt}
        onClose={() => setShowSetupPrompt(false)}
        onSetupComplete={handleSetupComplete}
      />
    </>
  )
} 
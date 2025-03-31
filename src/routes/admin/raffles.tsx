import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Define interfaces for our data
interface Raffle {
  id: string;
  name: string;
  description: string;
  draw_date: string;
  status: string;
  prize_description: string;
  created_at: string;
  updated_at: string;
}

interface RaffleTicket {
  id: string;
  raffle_id: string;
  referrer_id: string;
  referral_id: string;
  is_winner: boolean;
  created_at: string;
  referrers: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  referrals?: {
    id: string;
    referee_name: string;
  };
}

export const Route = createFileRoute('/admin/raffles')({
  component: AdminRaffles,
});

function AdminRaffles() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewRaffleDialogOpen, setIsNewRaffleDialogOpen] = useState(false);
  
  // Form state for new raffle
  const [newRaffle, setNewRaffle] = useState({
    name: '',
    description: '',
    draw_date: '',
    prize_description: '',
    status: 'active'
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Status options
  const statusOptions = [
    'active',
    'completed',
    'canceled'
  ];

  useEffect(() => {
    fetchRaffles();
  }, [statusFilter]);

  const fetchRaffles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply status filter
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        let filteredData = data as Raffle[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            raffle => 
              raffle.name.toLowerCase().includes(query) ||
              raffle.description.toLowerCase().includes(query) ||
              raffle.prize_description.toLowerCase().includes(query)
          );
        }
        
        setRaffles(filteredData);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaffleTickets = async (raffleId: string) => {
    try {
      const { data, error } = await supabase
        .from('raffle_tickets')
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
            referee_name
          )
        `)
        .eq('raffle_id', raffleId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setTickets(data as unknown as RaffleTicket[]);
    } catch (error) {
      console.error('Error fetching raffle tickets:', error);
      setTickets([]);
    }
  };

  const openRaffleDetails = async (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    await fetchRaffleTickets(raffle.id);
    setIsDialogOpen(true);
  };

  const handleCreateRaffle = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .insert([
          {
            name: newRaffle.name,
            description: newRaffle.description,
            draw_date: newRaffle.draw_date,
            prize_description: newRaffle.prize_description,
            status: newRaffle.status
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Close the dialog and reset form
      setIsNewRaffleDialogOpen(false);
      setNewRaffle({
        name: '',
        description: '',
        draw_date: '',
        prize_description: '',
        status: 'active'
      });
      
      // Refresh raffles list
      fetchRaffles();
      
    } catch (error) {
      console.error('Error creating raffle:', error);
      alert('Failed to create raffle. Please try again.');
    }
  };

  const handleUpdateRaffleStatus = async (raffleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('raffles')
        .update({ status: newStatus })
        .eq('id', raffleId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId ? { ...raffle, status: newStatus } : raffle
        )
      );
      
      // If this is the selected raffle, update it too
      if (selectedRaffle && selectedRaffle.id === raffleId) {
        setSelectedRaffle({ ...selectedRaffle, status: newStatus });
      }
      
    } catch (error) {
      console.error('Error updating raffle status:', error);
      alert('Failed to update raffle status. Please try again.');
    }
  };

  const handleDrawWinner = async (raffleId: string) => {
    if (!confirm('Are you sure you want to draw a winner? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Select a random ticket as the winner
      const { data, error } = await supabase.rpc('draw_raffle_winner', {
        raffle_id_param: raffleId
      });
      
      if (error) {
        throw error;
      }
      
      // Update raffle status to "completed"
      await handleUpdateRaffleStatus(raffleId, 'completed');
      
      // Refresh tickets for the selected raffle
      await fetchRaffleTickets(raffleId);
      
      alert('Winner has been selected successfully!');
      
    } catch (error) {
      console.error('Error drawing winner:', error);
      alert('Failed to draw winner. Please try again.');
    }
  };

  const handleDeleteRaffle = async (raffleId: string) => {
    if (!confirm('Are you sure you want to delete this raffle? This action cannot be undone.')) {
      return;
    }
    
    try {
      // First delete all tickets
      const { error: ticketsError } = await supabase
        .from('raffle_tickets')
        .delete()
        .eq('raffle_id', raffleId);
      
      if (ticketsError) {
        throw ticketsError;
      }
      
      // Then delete the raffle
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', raffleId);
      
      if (error) {
        throw error;
      }
      
      // Close dialog if open
      if (isDialogOpen) {
        setIsDialogOpen(false);
      }
      
      // Refresh raffles list
      fetchRaffles();
      
    } catch (error) {
      console.error('Error deleting raffle:', error);
      alert('Failed to delete raffle. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    fetchRaffles();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Raffles Management</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by name, description, prize..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => fetchRaffles()}
                >
                  Search
                </Button>
              </div>
            </div>
            
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
              Raffles
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({raffles.length} {raffles.length === 1 ? 'raffle' : 'raffles'})
                </span>
              )}
            </span>
            
            <Button 
              size="sm"
              onClick={() => setIsNewRaffleDialogOpen(true)}
            >
              Create Raffle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading raffles...</p>
            </div>
          ) : raffles.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No raffles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raffle</TableHead>
                    <TableHead>Draw Date</TableHead>
                    <TableHead>Prize</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {raffles.map((raffle) => (
                    <TableRow key={raffle.id}>
                      <TableCell>
                        <div className="font-medium">{raffle.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {raffle.description.length > 100 
                            ? raffle.description.substring(0, 100) + '...' 
                            : raffle.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(raffle.draw_date)}
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-xs">
                          {raffle.prize_description.length > 100 
                            ? raffle.prize_description.substring(0, 100) + '...' 
                            : raffle.prize_description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          raffle.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : raffle.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {raffle.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRaffleDetails(raffle)}
                          >
                            Manage
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteRaffle(raffle.id)}
                          >
                            Delete
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
      
      {/* Raffle Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedRaffle && (
            <>
              <DialogHeader>
                <DialogTitle>Raffle Details</DialogTitle>
                <DialogDescription>
                  Manage raffle: {selectedRaffle.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Raffle Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedRaffle.name}</p>
                      <p><span className="font-medium">Draw Date:</span> {formatDate(selectedRaffle.draw_date)}</p>
                      <p>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${
                          selectedRaffle.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedRaffle.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRaffle.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{selectedRaffle.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Prize</h3>
                    <p className="mt-1">{selectedRaffle.prize_description}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Tickets ({tickets.length})</h3>
                      {tickets.filter(t => t.is_winner).length > 0 && (
                        <span className="text-xs text-green-600 font-semibold">Winner Selected</span>
                      )}
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                      {tickets.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No tickets issued yet</p>
                      ) : (
                        <div className="space-y-2 p-2">
                          {tickets.map(ticket => (
                            <div key={ticket.id} className={`p-2 border rounded-md ${ticket.is_winner ? 'bg-green-50 border-green-200' : ''}`}>
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {ticket.referrers.full_name}
                                  {ticket.is_winner && (
                                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      Winner
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-sm">{ticket.referrers.email}</div>
                              {ticket.referrals && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Earned for referring: {ticket.referrals.referee_name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Created:</span> {new Date(selectedRaffle.created_at).toLocaleString()}</p>
                      <p><span className="font-medium">Last Updated:</span> {new Date(selectedRaffle.updated_at).toLocaleString()}</p>
                      <p><span className="font-medium">ID:</span> {selectedRaffle.id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Raffle Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRaffle.status === 'active' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDrawWinner(selectedRaffle.id)}
                        disabled={tickets.length === 0}
                      >
                        Draw Winner
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateRaffleStatus(selectedRaffle.id, 'canceled')}
                      >
                        Cancel Raffle
                      </Button>
                    </>
                  )}
                  
                  {selectedRaffle.status === 'canceled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateRaffleStatus(selectedRaffle.id, 'active')}
                    >
                      Reactivate Raffle
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Edit raffle functionality to be implemented')}
                  >
                    Edit Raffle
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleDeleteRaffle(selectedRaffle.id);
                    }}
                  >
                    Delete Raffle
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
      
      {/* Create New Raffle Dialog */}
      <Dialog open={isNewRaffleDialogOpen} onOpenChange={setIsNewRaffleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Raffle</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new partner raffle
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="raffle-name">Raffle Name</Label>
              <Input
                id="raffle-name"
                value={newRaffle.name}
                onChange={(e) => setNewRaffle({...newRaffle, name: e.target.value})}
                placeholder="Monthly Partner Raffle"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="raffle-description">Description</Label>
              <Textarea
                id="raffle-description"
                value={newRaffle.description}
                onChange={(e) => setNewRaffle({...newRaffle, description: e.target.value})}
                placeholder="Details about the raffle..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="raffle-prize">Prize Description</Label>
              <Textarea
                id="raffle-prize"
                value={newRaffle.prize_description}
                onChange={(e) => setNewRaffle({...newRaffle, prize_description: e.target.value})}
                placeholder="Description of the prize..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="draw-date">Draw Date</Label>
              <Input
                id="draw-date"
                type="datetime-local"
                value={newRaffle.draw_date}
                onChange={(e) => setNewRaffle({...newRaffle, draw_date: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRaffleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRaffle}
              disabled={
                !newRaffle.name || 
                !newRaffle.description || 
                !newRaffle.draw_date || 
                !newRaffle.prize_description
              }
            >
              Create Raffle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminRaffles; 
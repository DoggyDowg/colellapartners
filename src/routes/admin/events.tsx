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
import { AdminCheck } from '@/components/admin/AdminCheck';

// Define interfaces for our data
interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  max_attendees: number;
  event_type: string;
  created_at: string;
  updated_at: string;
}

interface EventAttendee {
  id: string;
  event_id: string;
  referrer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  referrers: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

export const Route = createFileRoute('/admin/events')({
  component: AdminEvents,
});

function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  
  // Form state for new event
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    max_attendees: 0,
    event_type: ''
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // Event type options
  const eventTypeOptions = [
    'networking',
    'wine_tasting',
    'seminar',
    'award_ceremony',
    'launch_party',
    'other'
  ];

  useEffect(() => {
    fetchEvents();
  }, [typeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      // Apply type filter
      if (typeFilter) {
        query = query.eq('event_type', typeFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        let filteredData = data as Event[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            event => 
              event.name.toLowerCase().includes(query) ||
              event.description.toLowerCase().includes(query) ||
              event.location.toLowerCase().includes(query)
          );
        }
        
        setEvents(filteredData);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAttendees = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          referrers (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAttendees(data as unknown as EventAttendee[]);
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      setAttendees([]);
    }
  };

  const openEventDetails = async (event: Event) => {
    setSelectedEvent(event);
    await fetchEventAttendees(event.id);
    setIsDialogOpen(true);
  };

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .insert([
          {
            name: newEvent.name,
            description: newEvent.description,
            event_date: newEvent.event_date,
            location: newEvent.location,
            max_attendees: newEvent.max_attendees,
            event_type: newEvent.event_type
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Close the dialog and reset form
      setIsNewEventDialogOpen(false);
      setNewEvent({
        name: '',
        description: '',
        event_date: '',
        location: '',
        max_attendees: 0,
        event_type: ''
      });
      
      // Refresh events list
      fetchEvents();
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      // First delete all attendees
      const { error: attendeesError } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId);
      
      if (attendeesError) {
        throw attendeesError;
      }
      
      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        throw error;
      }
      
      // Close dialog if open
      if (isDialogOpen) {
        setIsDialogOpen(false);
      }
      
      // Refresh events list
      fetchEvents();
      
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    fetchEvents();
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <AdminCheck />
      <h1 className="text-3xl font-bold mb-6">Events Management</h1>
      
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
                  placeholder="Search by name, description, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => fetchEvents()}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select 
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {eventTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
              Events
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({events.length} {events.length === 1 ? 'event' : 'events'})
                </span>
              )}
            </span>
            
            <Button 
              size="sm"
              onClick={() => setIsNewEventDialogOpen(true)}
            >
              Create Event
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {event.description.length > 100 
                            ? event.description.substring(0, 100) + '...' 
                            : event.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatEventDate(event.event_date)}
                      </TableCell>
                      <TableCell>
                        {event.location}
                      </TableCell>
                      <TableCell>
                        {event.event_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </TableCell>
                      <TableCell>
                        {event.max_attendees} attendees
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEventDetails(event)}
                          >
                            Manage
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:bg-red-50"
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
      
      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Event Details</DialogTitle>
                <DialogDescription>
                  Manage event: {selectedEvent.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedEvent.name}</p>
                      <p><span className="font-medium">Date:</span> {formatEventDate(selectedEvent.event_date)}</p>
                      <p><span className="font-medium">Location:</span> {selectedEvent.location}</p>
                      <p><span className="font-medium">Type:</span> {selectedEvent.event_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                      <p><span className="font-medium">Max Attendees:</span> {selectedEvent.max_attendees}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{selectedEvent.description}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Attendees ({attendees.length})</h3>
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                      {attendees.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No attendees yet</p>
                      ) : (
                        <div className="space-y-2 p-2">
                          {attendees.map(attendee => (
                            <div key={attendee.id} className="p-2 border rounded-md">
                              <p className="font-medium">{attendee.referrers.full_name}</p>
                              <div className="text-sm">{attendee.referrers.email}</div>
                              <div className="flex justify-between items-center mt-1">
                                <span className={`text-xs rounded-full px-2 py-0.5 ${
                                  attendee.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : attendee.status === 'invited'
                                    ? 'bg-blue-100 text-blue-800'
                                    : attendee.status === 'attended'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {attendee.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(attendee.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Created:</span> {new Date(selectedEvent.created_at).toLocaleString()}</p>
                      <p><span className="font-medium">Last Updated:</span> {new Date(selectedEvent.updated_at).toLocaleString()}</p>
                      <p><span className="font-medium">ID:</span> {selectedEvent.id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Event Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Edit event functionality to be implemented')}
                  >
                    Edit Event
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Send invitations functionality to be implemented')}
                  >
                    Send Invitations
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleDeleteEvent(selectedEvent.id);
                    }}
                  >
                    Delete Event
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
      
      {/* Create New Event Dialog */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new partner event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                placeholder="Partner Appreciation Dinner"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Details about the event..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date & Time</Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Venue address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select
                  value={newEvent.event_type}
                  onValueChange={(value) => setNewEvent({...newEvent, event_type: value})}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-attendees">Max Attendees</Label>
                <Input
                  id="max-attendees"
                  type="number"
                  min="1"
                  value={newEvent.max_attendees.toString()}
                  onChange={(e) => setNewEvent({...newEvent, max_attendees: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEvent}
              disabled={!newEvent.name || !newEvent.event_date || !newEvent.location || !newEvent.event_type}
            >
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEvents; 
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { TrashIcon } from '@radix-ui/react-icons';

// Define interfaces for types
export interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface Referral {
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
}

export interface StatusHistoryItem {
  id: string;
  referral_id: string;
  previous_status: string | null;
  new_status: string;
  notes?: string;
  created_at: string;
  changed_by?: string;
  user_full_name?: string;
}

export interface Note {
  user: string;
  content: string;
  date: string;
}

interface ReferralDetailsDialogProps {
  referral: Referral | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusHistory: StatusHistoryItem[];
  loadingHistory: boolean;
  statusNote: string;
  onStatusNoteChange: (value: string) => void;
  onAddNote: (referralId: string) => void;
  onConfirmNoteDelete: (index: number) => void;
  onUpdateStatus: (referralId: string, newStatus: string) => void;
  getStatusOptionsForType: (type: string) => string[];
  getStatusBadgeClass: (status: string) => string;
  formatDate: (dateString: string) => string;
  formatTimeAgo: (dateString: string) => string;
  parseNotes: (notesJson?: string) => Note[];
  getInitials: (name: string) => string;
  referrerName?: string;
  referrerEmail?: string;
  referrerPhone?: string;
}

export const ReferralDetailsDialog: React.FC<ReferralDetailsDialogProps> = ({
  referral,
  open,
  onOpenChange,
  statusHistory,
  loadingHistory,
  statusNote,
  onStatusNoteChange,
  onAddNote,
  onConfirmNoteDelete,
  onUpdateStatus,
  getStatusOptionsForType,
  getStatusBadgeClass,
  formatDate,
  formatTimeAgo,
  parseNotes,
  getInitials,
  referrerName,
  referrerEmail,
  referrerPhone,
}) => {
  if (!referral) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <>
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
            <DialogDescription>
              Manage the referral for {referral.referee_name}
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
                      <p><span className="font-medium">Name:</span> {referral.referee_name}</p>
                      <p><span className="font-medium">Email:</span> {referral.referee_email}</p>
                      <p><span className="font-medium">Phone:</span> {referral.referee_phone}</p>
                      <p><span className="font-medium">Type:</span> {referral.referee_type.charAt(0).toUpperCase() + referral.referee_type.slice(1)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Referrer Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Name:</span> {referrerName || referral.referrers?.full_name}</p>
                      <p><span className="font-medium">Email:</span> {referrerEmail || referral.referrers?.email}</p>
                      <p><span className="font-medium">Phone:</span> {referrerPhone || referral.referrers?.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Referral Details</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Created:</span> {formatDate(referral.created_at)}</p>
                      <p>
                        <span className="font-medium">Status:</span>
                        <Badge className={`ml-2 ${getStatusBadgeClass(referral.status)}`}>
                          {referral.status || 'New'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  
                  {referral.situation_description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Situation Description</h3>
                      <p className="mt-1">{referral.situation_description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {getStatusOptionsForType(referral.referee_type).map((status) => (
                    <Button
                      key={status}
                      variant={referral.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => onUpdateStatus(referral.id, status)}
                    >
                      {status}
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
                      onChange={(e) => onStatusNoteChange(e.target.value)}
                      className="h-24"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      onClick={() => onAddNote(referral.id)}
                      disabled={!statusNote.trim()}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Notes History</h3>
                  {referral.additional_notes ? (
                    <div className="space-y-3">
                      {parseNotes(referral.additional_notes).map((note, index) => (
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
                                    onClick={() => onConfirmNoteDelete(index)}
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
                            <Badge className={`ml-1 ${getStatusBadgeClass(item.previous_status || 'New')}`}>
                              {item.previous_status || 'New'}
                            </Badge>
                            <span className="font-medium ml-1">to</span>
                            <Badge className={`ml-1 ${getStatusBadgeClass(item.new_status)}`}>
                              {item.new_status}
                            </Badge>
                            {item.user_full_name && (
                              <span className="font-medium ml-1">by {item.user_full_name}</span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="text-sm mt-1">{item.notes}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralDetailsDialog; 
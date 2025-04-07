import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

// Define interfaces for types
export interface Referrer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface Referral {
  id: string;
  referee_name: string;
  referee_type: string;
}

export interface Reward {
  id: string;
  referral_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  reward_type: 'cash' | 'gift_card';
  gift_card_details?: any;
  payment_date?: string;
  created_at: string;
  updated_at?: string;
  referrers?: Referrer;
  referrals?: Referral;
}

interface RewardDetailsDialogProps {
  reward: Reward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusOptions: string[];
  updateRewardStatus: (rewardId: string, status: string) => void;
  referrerName?: string;
  referrerEmail?: string;
  referrerPhone?: string;
}

export const RewardDetailsDialog: React.FC<RewardDetailsDialogProps> = ({
  reward,
  open,
  onOpenChange,
  statusOptions,
  updateRewardStatus,
  referrerName,
  referrerEmail,
  referrerPhone,
}) => {
  if (!reward) return null;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <>
          <DialogHeader>
            <DialogTitle>Reward Details</DialogTitle>
            <DialogDescription>
              Manage reward for {reward.referrals?.referee_name || 'Unknown'}'s referral
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Reward Information</h3>
                <div className="mt-1 space-y-2">
                  <p><span className="font-medium">Amount:</span> ${reward.amount.toFixed(2)}</p>
                  <p><span className="font-medium">Type:</span> {reward.reward_type === 'gift_card' ? 'Gift Card' : 'Cash'}</p>
                  <p><span className="font-medium">Created:</span> {new Date(reward.created_at).toLocaleString()}</p>
                  {reward.payment_date && (
                    <p><span className="font-medium">Payment Date:</span> {new Date(reward.payment_date).toLocaleString()}</p>
                  )}
                  <p>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(reward.status)}`}>
                      {(reward.status || 'pending').charAt(0).toUpperCase() + (reward.status || 'pending').slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Partner Information</h3>
                <div className="mt-1 space-y-2">
                  <p><span className="font-medium">Name:</span> {referrerName || reward.referrers?.full_name || 'Unknown'}</p>
                  <p><span className="font-medium">Email:</span> {referrerEmail || reward.referrers?.email || 'No email'}</p>
                  <p><span className="font-medium">Phone:</span> {referrerPhone || reward.referrers?.phone || 'No phone'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Referral Information</h3>
                <div className="mt-1 space-y-2">
                  <p><span className="font-medium">Referee Name:</span> {reward.referrals?.referee_name || 'Unknown'}</p>
                  <p><span className="font-medium">Referral Type:</span> {reward.referrals?.referee_type || 'Unknown'}</p>
                  <p><span className="font-medium">Referral ID:</span> {reward.referral_id}</p>
                </div>
              </div>
              
              {reward.gift_card_details && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Gift Card Details</h3>
                  <div className="mt-1 space-y-2">
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                      {JSON.stringify(reward.gift_card_details, null, 2)}
                    </pre>
                  </div>
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
                  variant={reward.status === status ? "default" : "outline"}
                  size="sm"
                  disabled={reward.status === 'paid' && status !== 'paid'} // Can't revert from paid
                  onClick={() => updateRewardStatus(reward.id, status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
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

export default RewardDetailsDialog; 
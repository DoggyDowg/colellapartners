import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Partner } from './ReferralDetailsDialog'; // Import Partner type instead of Referrer

// Props for the dialog
interface LinkReferrerDialogProps {
  referralId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkComplete: (update: { referrer_id: string, partnerDetails: Partner }) => void;
}

export function LinkReferrerDialog({ referralId, open, onOpenChange, onLinkComplete }: LinkReferrerDialogProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch partners (referrers) when dialog opens
  useEffect(() => {
    const fetchPartners = async () => {
      if (!open) return;
      setLoading(true);
      setSelectedPartnerId(null);
      setSearchTerm('');
      try {
        const { data, error } = await supabase
          .from('referrers')
          .select('id, full_name, email, phone')
          .order('full_name');
          
        if (error) throw error;
        setPartners(data || []);
      } catch (error) {
        console.error("Error fetching partners:", error);
        toast.error("Failed to load partners");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [open]);

  // Filter partners based on search term
  const filteredPartners = partners.filter(partner =>
    !searchTerm ||
    (partner.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (partner.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (partner.phone?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle linking the partner
  const handleLinkPartner = async () => {
    if (!referralId || !selectedPartnerId) return;

    const selectedPartner = partners.find(partner => partner.id === selectedPartnerId);
    if (!selectedPartner) {
      toast.error("Selected partner not found. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      // Update the referral table with the selected referrer_id
      const { error: referralUpdateError } = await supabase
        .from('referrals')
        .update({ referrer_id: selectedPartnerId })
        .eq('id', referralId);

      if (referralUpdateError) {
        console.error("Error updating referral link:", referralUpdateError);
        throw new Error("Failed to link partner to referral.");
      }

      toast.success("Partner linked successfully!");
      // Pass back the selected partner ID and details
      onLinkComplete({
          referrer_id: selectedPartnerId,
          partnerDetails: selectedPartner 
      }); 
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error linking partner:", error);
      toast.error(error.message || "Failed to link partner.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Partner</DialogTitle>
          <DialogDescription>
            Select an existing partner from the database to link to this referral.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search partners by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedPartnerId === partner.id ? 'bg-accent border-primary' : 'hover:bg-accent/50'}`}
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    <p className="font-medium text-sm">{partner.full_name || 'No Name'}</p>
                    <p className="text-xs text-muted-foreground">{partner.email || '-'} | {partner.phone || '-'}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {searchTerm ? 'No matching partners found.' : (loading ? '' : 'No partners found in the database.')}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkPartner}
            disabled={!selectedPartnerId || isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Link Selected Partner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
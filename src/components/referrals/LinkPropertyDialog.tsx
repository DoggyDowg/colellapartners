import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { handleError } from '@/utils/error-handler';
import { PropertyDetails, extractPropertyAddressData } from '../../utils/property-utils';

// Define interfaces for types
interface LinkPropertyDialogProps {
  referralId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkComplete: (updatedReferral: { vault_property_id: string, propertyDetails: PropertyDetails }) => void;
}

export function LinkPropertyDialog({ referralId, open, onOpenChange, onLinkComplete }: LinkPropertyDialogProps) {
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch properties when dialog opens
  useEffect(() => {
    const fetchProperties = async () => {
      if (!open) return;
      setLoading(true);
      setSelectedPropertyId(null);
      setSearchTerm('');
      try {
        const { data, error } = await supabase
          .from('vault_properties')
          .select('id, address, city, state, zip, county, parcel_id')
          .order('address');
          
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        handleError(error, {
          context: 'LinkPropertyDialog.fetchProperties',
          toastMessage: "Failed to load properties",
          showToast: true
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [open]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(property =>
    !searchTerm ||
    (property.address?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.state?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.zip?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.county?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.parcel_id?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle linking the property
  const handleLinkProperty = async () => {
    if (!referralId || !selectedPropertyId) return;

    const selectedProperty = properties.find(property => property.id === selectedPropertyId);
    if (!selectedProperty) {
      toast.error("Selected property not found. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      // Update the referral table with the selected property_id
      const { error: referralUpdateError } = await supabase
        .from('referrals')
        .update({ vault_property_id: selectedPropertyId })
        .eq('id', referralId);

      if (referralUpdateError) {
        handleError(referralUpdateError, {
          context: 'LinkPropertyDialog.updateReferral',
          toastMessage: "Failed to link property to referral",
          showToast: false
        });
        throw new Error("Failed to link property to referral");
      }

      toast.success("Property linked successfully!");
      // Pass back the selected property ID and details
      onLinkComplete({
          vault_property_id: selectedPropertyId,
          propertyDetails: selectedProperty 
      }); 
      onOpenChange(false);
    } catch (error) {
      handleError(error, {
        context: 'LinkPropertyDialog.handleLinkProperty',
        toastMessage: "Failed to link property",
        showToast: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Property</DialogTitle>
          <DialogDescription>
            Select an existing property from the database to link to this referral.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties by address, city, state, zip..."
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
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedPropertyId === property.id ? 'bg-accent border-primary' : 'hover:bg-accent/50'}`}
                    onClick={() => setSelectedPropertyId(property.id)}
                  >
                    <p className="font-medium text-sm">{extractPropertyAddressData(property)}</p>
                    <p className="text-xs text-muted-foreground">
                      County: {property.county || '-'} | Parcel ID: {property.parcel_id || '-'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {searchTerm ? 'No matching properties found.' : (loading ? '' : 'No properties found in the database.')}
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
            onClick={handleLinkProperty}
            disabled={!selectedPropertyId || isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Link Selected Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
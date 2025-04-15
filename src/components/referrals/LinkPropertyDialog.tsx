import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { getLinkableProperties, Property } from '@/lib/vault-re-api'; // Assuming this function fetches properties and Property type
import { supabase } from '@/lib/supabase'; // Assuming supabase client setup
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the props interface
interface LinkPropertyDialogProps {
  referralId: string | null; // The ID of the referral to link
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkComplete: (updatedReferral: { vault_property_id: string, propertyDetails: any }) => void; // Callback after linking is done, passing back necessary details
}

// Helper function to extract address data from VaultRE Property object
export const extractPropertyAddressData = (property: Property) => {
  if (!property || !property.address) return null;

  const addr = property.address;

  // Construct address components
  let streetAddress = addr.street || '';
  if (addr.streetNumber) {
    streetAddress = `${addr.streetNumber} ${streetAddress}`;
  }
  if (addr.unitNumber) {
    streetAddress = `Unit ${addr.unitNumber}, ${streetAddress}`;
  }

  // Handle potentially nested suburb object or simple string
  let suburbName = '';
  let postcode = addr.postcode || '';
  let stateAbbr = addr.state || '';

  if (typeof addr.suburb === 'object' && addr.suburb !== null) {
    suburbName = addr.suburb.name || '';
    postcode = addr.suburb.postcode || postcode;
    stateAbbr = addr.suburb.state?.abbreviation || stateAbbr;
  } else if (typeof addr.suburb === 'string') {
    suburbName = addr.suburb;
  }

  // Create formatted addresses
  const postalAddressString = [
    streetAddress,
    suburbName,
    stateAbbr,
    postcode
  ].filter(Boolean).join(', ');

  const displayAddress = addr.displayAddress || [
    streetAddress,
    suburbName
  ].filter(Boolean).join(' ');

  return {
    street_address: streetAddress.trim() || null,
    suburb: suburbName || null,
    state: stateAbbr || null,
    post_code: postcode || null,
    postal_address: postalAddressString || null,
    display_address: displayAddress || null
  };
};


export function LinkPropertyDialog({ referralId, open, onOpenChange, onLinkComplete }: LinkPropertyDialogProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch properties when dialog opens
  useEffect(() => {
    const fetchProps = async () => {
      if (!open) return;
      setLoading(true);
      setSelectedPropertyId(null); // Reset selection
      setSearchTerm(''); // Reset search
      try {
        const props = await getLinkableProperties();
        setProperties(props);
      } catch (error) {
        console.error("Error fetching properties for linking:", error);
        toast.error("Failed to load properties from VaultRE");
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, [open]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(prop =>
    !searchTerm ||
    (prop.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prop.displayAddress && prop.displayAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prop.id?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle linking the property
  const handleLinkProperty = async () => {
    if (!referralId || !selectedPropertyId) return;

    const selectedProperty = properties.find(prop => prop.id === selectedPropertyId);
    if (!selectedProperty) {
      toast.error("Selected property not found. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Prepare property data for our table
      const propertyDataForTable = {
        vault_property_id: selectedProperty.id,
        referral_id: referralId,
        address: extractPropertyAddressData(selectedProperty),
        status: selectedProperty.status,
        property_type: selectedProperty.type?.name || selectedProperty.propertyType,
        bedrooms: selectedProperty.bedrooms,
        bathrooms: selectedProperty.bathrooms,
        car_spaces: selectedProperty.carSpaces,
        price_text: selectedProperty.priceText || selectedProperty.displayPrice,
        listed_date: selectedProperty.listedDate,
        agent_name: selectedProperty.agent?.name,
        agent_email: selectedProperty.agent?.email,
        agent_phone: selectedProperty.agent?.phone,
        vault_last_modified: selectedProperty.dateModified || null,
        updated_at: new Date().toISOString()
      };

      // 2. Upsert into the properties table
      const { error: upsertError } = await supabase
        .from('properties')
        .upsert(propertyDataForTable, { onConflict: 'vault_property_id' });

      if (upsertError) {
        console.error("Error upserting property:", upsertError);
        throw new Error("Failed to save property details.");
      }

      // 3. Update the referral table with the vault_property_id
      const { error: referralUpdateError } = await supabase
        .from('referrals')
        .update({ vault_property_id: selectedPropertyId })
        .eq('id', referralId);

      if (referralUpdateError) {
        console.error("Error updating referral link:", referralUpdateError);
        throw new Error("Failed to link property to referral.");
      }

      toast.success("Property linked successfully!");
      // Pass back the linked property ID and the full details we just upserted
      onLinkComplete({
          vault_property_id: selectedPropertyId,
          propertyDetails: propertyDataForTable 
      }); 
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error linking property:", error);
      toast.error(error.message || "Failed to link property.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Property to Referral</DialogTitle>
          <DialogDescription>
            Select a property from VaultRE to link to this referral for tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties by address or ID..."
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
                filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedPropertyId === prop.id ? 'bg-accent border-primary' : 'hover:bg-accent/50'}`}
                    onClick={() => setSelectedPropertyId(prop.id)}
                  >
                    <p className="font-medium text-sm">{prop.displayAddress || prop.address?.fullAddress || 'No Address'}</p>
                    <p className="text-xs text-muted-foreground">ID: {prop.id} | Status: {prop.status || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {searchTerm ? 'No matching properties found.' : 'No properties available to link.'}
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
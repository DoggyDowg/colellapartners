import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { handleError } from '@/utils/error-handler';
import { getLinkableProperties } from '@/lib/vault-re-api';

// Use type from vault-re-api to define our component's property state
type PropertyDetails = {
  id: string;
  address: string;
  parcel_id: string;
  city: string;
  state: string;
  zip: string;
  county: string;
};

// Define interfaces for component props
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

  // Fetch properties from VaultRE API when dialog opens
  useEffect(() => {
    const fetchProperties = async () => {
      if (!open) return;
      setLoading(true);
      setSelectedPropertyId(null);
      setSearchTerm('');
      try {
        // Use the VaultRE API to fetch properties that can be linked
        const propertiesData = await getLinkableProperties();

        // Safety check - ensure we have an array
        if (!Array.isArray(propertiesData)) {
          throw new Error('VaultRE API did not return an array of properties');
        }

        // Map the VaultRE property data to our component's PropertyDetails format
        const mappedProperties: PropertyDetails[] = propertiesData.map(property => {
          // Ensure property is valid before accessing properties
          if (!property) {
            return {
              id: 'unknown',
              address: 'Unknown address',
              parcel_id: 'unknown',
              city: '',
              state: '',
              zip: '',
              county: '',
            };
          }

          // Extract display address from the property
          const displayAddress = property.displayAddress || 
                                (property.address?.fullAddress || 
                                 property.address?.displayAddress || 
                                 'Address not available');
          
          // Extract location details if available
          let city = '';
          let state = '';
          let zip = '';
          
          // Handle suburb which can be either a string or an object
          if (property.address?.suburb) {
            if (typeof property.address.suburb === 'string') {
              city = property.address.suburb;
            } else if (typeof property.address.suburb === 'object') {
              // It's an object with properties like name, postcode, state
              city = property.address.suburb.name || '';
              if (property.address.suburb.state?.abbreviation) {
                state = property.address.suburb.state.abbreviation;
              }
              zip = property.address.suburb.postcode || '';
            }
          }
          
          // Fallback to direct properties if suburb object didn't provide values
          if (!state && property.address?.state) {
            state = property.address.state;
          }
          
          if (!zip && property.address?.postcode) {
            zip = property.address.postcode;
          }

          return {
            id: property.id, // Use the VaultRE property ID
            address: displayAddress,
            parcel_id: String(property.id || ''), // Convert the VaultRE property ID to a string
            city,
            state,
            zip,
            county: '', // VaultRE doesn't seem to have a direct county field
          };
        });

        setProperties(mappedProperties);
      } catch (error) {
        handleError(error, {
          context: 'LinkPropertyDialog.fetchProperties',
          toastMessage: "Failed to load properties from VaultRE",
          showToast: true
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [open]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(property => {
    // Safely convert all properties to lowercase strings
    const searchableAddress = (property.address || '').toLowerCase();
    const searchableCity = (property.city || '').toLowerCase();
    const searchableState = (property.state || '').toLowerCase();
    const searchableZip = (property.zip || '').toLowerCase();
    const searchableId = String(property.parcel_id || '').toLowerCase(); // Ensure parcel_id is a string
    const searchTermLower = searchTerm.toLowerCase();
    
    // Search within all available property fields
    return !searchTerm ||
           searchableAddress.includes(searchTermLower) ||
           searchableCity.includes(searchTermLower) ||
           searchableState.includes(searchTermLower) ||
           searchableZip.includes(searchTermLower) ||
           searchableId.includes(searchTermLower);
  });

  // Handle linking the property
  const handleLinkProperty = async () => {
    if (!referralId || !selectedPropertyId) return;

    const selectedProperty = properties.find(property => property.id === selectedPropertyId);
    if (!selectedProperty) {
      toast.error("Selected property not found. Please try again.");
      return;
    }

    // We need the vault_property_id from the selected property to update the referral
    const vaultPropertyIdToLink = selectedProperty.parcel_id; // This is now directly the VaultRE property ID
    
    if (!vaultPropertyIdToLink) {
        toast.error("Could not find the VaultRE Property ID for the selected property.");
        handleError(new Error("Missing vault_property_id"), {
          context: 'LinkPropertyDialog.handleLinkProperty',
          toastMessage: "Internal error: Missing VaultRE ID",
          showToast: false,
        });
        return;
    }

    setIsProcessing(true);
    try {
      // Update the referral table with the selected property's VAULT ID
      const { error: referralUpdateError } = await supabase
        .from('referrals')
        .update({ vault_property_id: vaultPropertyIdToLink })
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
      // Pass back the selected property's VAULT ID and details
      onLinkComplete({
          vault_property_id: vaultPropertyIdToLink,
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
            Select an existing property from VaultRE to link to this referral.
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
                    <p className="font-medium text-sm">{property.address}</p>
                    {property.city && property.state && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {property.city}, {property.state} {property.zip}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      VaultRE ID: {property.parcel_id}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {searchTerm ? 'No matching properties found.' : (loading ? '' : 'No properties found in VaultRE.')}
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
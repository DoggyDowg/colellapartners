import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getPropertyById } from '../../lib/vault-re-api'; // Import the VaultRE API client
import { differenceInDays, parseISO } from 'date-fns';
import { SettlementDialog } from './SettlementDialog';
import { LinkPropertyDialog } from './LinkPropertyDialog'; // Remove the imports that were moved
import { LinkReferrerDialog } from './LinkReferrerDialog';
import { cn } from '../../lib/utils';
import supabase from "../../lib/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { handleError } from '@/utils/error-handler';
import { PropertyDetails, extractPropertyAddressData } from '../../utils/property-utils'; // Import from the new location

// Define interfaces for types
export interface Partner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface Referral {
  id: string;
  referrer_id?: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string;
  referee_type: string;
  created_at: string;
  status: string;
  situation_description?: string;
  additional_notes?: string;
  referrers?: Partner;
  referee_address?: {
    street_address?: string;
    suburb?: string;
    state?: string;
    post_code?: string;
    postal_address?: string;
    display_address?: string;
  };
  vault_property_id?: string;
  settlement_date?: string;
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

// Extend PropertyDetails to create ExtendedPropertyDetails
export interface ExtendedPropertyDetails extends PropertyDetails {
  status?: string;
  property_type?: string;
  price_text?: string;
  address_obj?: {
    display_address?: string;
    street_address?: string;
    suburb?: string;
    state?: string;
    post_code?: string;
    postal_address?: string;
    [key: string]: unknown;
  };
}

// Define a generic type for property data from the API
interface VaultPropertyData {
  id?: unknown;
  address?: unknown;
  status?: string;
  type?: unknown;
  propertyType?: unknown;
  agency?: unknown;
  priceText?: string;
  displayPrice?: string;
  [key: string]: unknown;
}

// Define interfaces for property data structures
interface AddressData {
  display_address?: string;
  suburb?: {
    name?: string;
  };
  state?: string;
  postcode?: string;
}

interface PropertyAddress {
  suburb?: string | { name?: string };
  state?: string;
  postcode?: string;
}

interface VaultPropertyType {
  name?: string;
}

interface VaultPropertyAgency {
  name?: string;
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
  partnerName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  linkedProperty?: ExtendedPropertyDetails | null;
  loadingProperty?: boolean;
  onSyncComplete?: (updatedReferral: Partial<Referral>) => void;
}

// Calculate days away helper function
const calculateDaysAway = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    const days = differenceInDays(date, today);
    
    if (days < 0) return '(settlement date passed)';
    if (days === 0) return '(today)';
    if (days === 1) return '(tomorrow)';
    return `(${days} days away)`;
  } catch (_error) {
    return '';
  }
};

export const ReferralDetailsDialog: React.FC<ReferralDetailsDialogProps> = ({
  referral: initialReferral,
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
  partnerName: initialPartnerName, // Rename prop
  partnerEmail: initialPartnerEmail, // Rename prop
  partnerPhone: initialPartnerPhone, // Rename prop
  linkedProperty: initialLinkedProperty,
  loadingProperty: initialLoadingProperty,
  onSyncComplete,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{referralId: string, status: string} | null>(null);
  const [referral, setReferral] = useState<Referral | null>(initialReferral);
  const [isLinkPropertyDialogOpen, setIsLinkPropertyDialogOpen] = useState(false);
  const [linkedProperty, setLinkedProperty] = useState<ExtendedPropertyDetails | null>(initialLinkedProperty || null);
  const [loadingProperty, setLoadingProperty] = useState(initialLoadingProperty);
  const [isLinkReferrerDialogOpen, setIsLinkReferrerDialogOpen] = useState(false); // State for link referrer dialog
  const [partnerDetails, setPartnerDetails] = useState<Partner | null>(initialReferral?.referrers || null); // Local state for partner details
  const [isSaving, setIsSaving] = useState(false);
  const [isPropertyWarningOpen, setIsPropertyWarningOpen] = useState(false);

  // Update local referral state when prop changes
  React.useEffect(() => {
    setReferral(initialReferral);
    // Also update local partner details if the referral prop changes
    setPartnerDetails(initialReferral?.referrers || null);
    
    // Debug logging to understand the data structure
    if (process.env.NODE_ENV === 'development') {
      handleError({message: 'Referral state updated', data: { 
        hasReferrerId: !!initialReferral?.referrer_id,
        referrerId: initialReferral?.referrer_id,
        hasReferrers: !!initialReferral?.referrers,
        referrers: initialReferral?.referrers
      }}, {
        context: 'ReferralDetailsDialog.useEffect',
        silent: true,
        showToast: false
      });
    }
  }, [initialReferral]);
  
  // Update local partner details based on props if available
  // This handles cases where parent passes updated partner info separately
  React.useEffect(() => {
    if (initialPartnerName || initialPartnerEmail || initialPartnerPhone) {
        setPartnerDetails(prev => ({
            id: prev?.id || 'temp-id', // Keep existing ID if possible, otherwise use placeholder
            full_name: initialPartnerName || prev?.full_name || '',
            email: initialPartnerEmail || prev?.email || '',
            phone: initialPartnerPhone || prev?.phone || ''
        }));
    } else if (!initialReferral?.referrer_id) {
        // If parent explicitly passes null/undefined and no referrer_id, clear local state
        setPartnerDetails(null);
    }
  }, [initialPartnerName, initialPartnerEmail, initialPartnerPhone, initialReferral?.referrer_id]);

  // Update local linked property state when prop changes
  React.useEffect(() => {
    const fetchPropertyData = async () => {
      if (!referral) return;
      
      // If no vault_property_id, no need to try loading
      if (!referral.vault_property_id) {
        setLinkedProperty(null);
        setLoadingProperty(false);
        return;
      }
      
      setLoadingProperty(true);
      
      try {
        // First look for a property with matching referral_id
        const { data: propertyByReferral, error: referralError } = await supabase
          .from('properties')
          .select('*')
          .eq('referral_id', referral.id)
          .single();
        
        if (!referralError && propertyByReferral) {
          // We found a direct match by referral_id
          const propertyDetails: ExtendedPropertyDetails = {
            id: propertyByReferral.id,
            address: propertyByReferral.address?.display_address || 'Address Not Available',
            city: propertyByReferral.address?.suburb || '',
            state: propertyByReferral.address?.state || '',
            zip: propertyByReferral.address?.post_code || '',
            county: '',
            parcel_id: propertyByReferral.vault_property_id,
            status: propertyByReferral.status,
            property_type: propertyByReferral.property_type,
            price_text: propertyByReferral.price_text,
            address_obj: propertyByReferral.address
          };
          
          setLinkedProperty(propertyDetails);
          setLoadingProperty(false);
          return;
        }
        
        // Fallback: Try finding by vault_property_id
        const { data: propertyByVaultId, error: vaultError } = await supabase
          .from('properties')
          .select('*')
          .eq('vault_property_id', referral.vault_property_id)
          .single();
        
        if (!vaultError && propertyByVaultId) {
          // We found a match by vault_property_id
          const propertyDetails: ExtendedPropertyDetails = {
            id: propertyByVaultId.id,
            address: propertyByVaultId.address?.display_address || 'Address Not Available',
            city: propertyByVaultId.address?.suburb || '',
            state: propertyByVaultId.address?.state || '',
            zip: propertyByVaultId.address?.post_code || '',
            county: '',
            parcel_id: propertyByVaultId.vault_property_id,
            status: propertyByVaultId.status,
            property_type: propertyByVaultId.property_type,
            price_text: propertyByVaultId.price_text,
            address_obj: propertyByVaultId.address
          };
          
          setLinkedProperty(propertyDetails);
        } else {
          // No property found in our database, but we have a vault_property_id
          // Optionally try to fetch from VaultRE here
          setLinkedProperty(initialLinkedProperty || null);
        }
      } catch (error) {
        handleError(error, {
          context: 'ReferralDetailsDialog.fetchPropertyData',
          toastMessage: 'Error loading property details',
          showToast: false,
          silent: true
        });
        setLinkedProperty(initialLinkedProperty || null);
      } finally {
        setLoadingProperty(false);
      }
    };
    
    fetchPropertyData();
  }, [referral, initialLinkedProperty]);
  
  React.useEffect(() => {
    setLoadingProperty(initialLoadingProperty);
  }, [initialLoadingProperty]);

  // Status mapping from VaultRE property status to internal referral status
  const statusMap: Record<string, string> = {
    'listing': 'Listed',
    'live': 'Listed',
    'conditional': 'Sold',
    'unconditional': 'Sold',
    'settled': 'Settled',
    'leased': 'Signed Up',
    'withdrawn': 'Withdrawn',
    'prospect': 'Referred',
    'appraisal': 'Appraised',
  };

  // Helper to adapt VaultRE Property to PropertyDetails type
  const adaptPropertyToPropertyDetails = (property: VaultPropertyData): ExtendedPropertyDetails => {
    // Extract address details
    // Pass the property as unknown first to avoid type errors
    const addressData = extractPropertyAddressData(property as unknown as PropertyDetails);
    
    // Handle different address formats safely
    let displayAddress = '';
    if (typeof addressData === 'string') {
      displayAddress = addressData;
    } else if (addressData && typeof addressData === 'object') {
      displayAddress = (addressData as AddressData).display_address || '';
    }
    
    // Direct address access as a fallback
    if (!displayAddress && property.address && typeof property.address === 'object') {
      const addressObj = property.address as Record<string, unknown>;
      if (addressObj.fullAddress && typeof addressObj.fullAddress === 'string') {
        displayAddress = addressObj.fullAddress;
      } else if (addressObj.displayAddress && typeof addressObj.displayAddress === 'string') {
        displayAddress = addressObj.displayAddress;
      } else if (addressObj.postal_address && typeof addressObj.postal_address === 'string') {
        displayAddress = addressObj.postal_address;
      } else if (addressObj.display_address && typeof addressObj.display_address === 'string') {
        displayAddress = addressObj.display_address;
      }
    }
    
    // Prepare the address_obj with all available address properties
    let addressObj: ExtendedPropertyDetails['address_obj'] = { display_address: displayAddress };
    
    // If property has address object, try to map its fields to our structure
    if (property.address && typeof property.address === 'object') {
      const propAddress = property.address as Record<string, unknown>;
      addressObj = {
        display_address: displayAddress,
        // Map known fields, keeping only string values
        street_address: typeof propAddress.street_address === 'string' ? propAddress.street_address : 
                        typeof propAddress.streetAddress === 'string' ? propAddress.streetAddress : undefined,
        suburb: typeof propAddress.suburb === 'string' ? propAddress.suburb : 
               typeof propAddress.suburb === 'object' && propAddress.suburb && typeof (propAddress.suburb as Record<string, unknown>).name === 'string' ? 
               String((propAddress.suburb as Record<string, unknown>).name) : undefined,
        state: typeof propAddress.state === 'string' ? propAddress.state : undefined,
        post_code: typeof propAddress.postcode === 'string' ? propAddress.postcode : 
                  typeof propAddress.post_code === 'string' ? propAddress.post_code : undefined,
        postal_address: typeof propAddress.postal_address === 'string' ? propAddress.postal_address : 
                       typeof propAddress.postalAddress === 'string' ? propAddress.postalAddress : undefined
      };
    }
      
    return {
      id: String(property.id || ''),
      address: displayAddress,
      city: typeof property.address === 'object' && property.address 
        ? String(((property.address as PropertyAddress)?.suburb as { name?: string })?.name || (property.address as PropertyAddress)?.suburb || '')
        : '',
      state: typeof property.address === 'object' && property.address 
        ? String((property.address as PropertyAddress)?.state || '')
        : '',
      zip: typeof property.address === 'object' && property.address 
        ? String((property.address as PropertyAddress)?.postcode || (property.address as Record<string, unknown>)?.post_code || '')
        : '',
      county: typeof property.agency === 'object' && property.agency 
        ? String((property.agency as VaultPropertyAgency)?.name || '')
        : '',
      parcel_id: String(property.id || ''), // Use property ID as fallback if no parcel ID
      status: typeof property.status === 'string' ? property.status.toLowerCase() : undefined,
      property_type: typeof property.type === 'object' && property.type 
        ? String((property.type as VaultPropertyType)?.name || property.propertyType || '')
        : typeof property.propertyType === 'string' ? property.propertyType 
        : typeof property.property_type === 'string' ? property.property_type : undefined,
      price_text: typeof property.priceText === 'string' ? property.priceText 
        : typeof property.displayPrice === 'string' ? property.displayPrice
        : typeof property.price_text === 'string' ? property.price_text : undefined,
      address_obj: addressObj
    };
  };

  const handleSyncStatus = async () => {
    if (!referral?.id || !referral.vault_property_id) return;

    setIsSyncing(true);
    setLoadingProperty(true); // Indicate loading
    try {
      // First check if we have the property in our database
      const { data: dbProperty, error: dbError } = await supabase
        .from('properties')
        .select('*')
        .eq('vault_property_id', referral.vault_property_id)
        .single();
      
      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        handleError(dbError, {
          context: 'ReferralDetailsDialog.handleSyncStatus.fetchDb',
          toastMessage: 'Error checking local property database',
          showToast: false,
          silent: true
        });
      }
      
      // Then fetch the latest data from VaultRE
      const property = await getPropertyById(referral.vault_property_id);
      
      if (property) {
        // Adapt property data to match our PropertyData interface
        // First cast to unknown, then to our expected type to avoid TypeScript errors
        const propertyData = adaptPropertyToPropertyDetails(property as unknown as VaultPropertyData);
        
        // Merge database data if available
        if (dbProperty) {
          // Directly use the values from the database
          propertyData.status = dbProperty.status;
          propertyData.property_type = dbProperty.property_type;
          propertyData.price_text = dbProperty.price_text;
          
          // Use the address object directly
          if (dbProperty.address) {
            propertyData.address_obj = dbProperty.address;
          }
        }
        
        // Update local property state
        setLinkedProperty(propertyData);
      }

      if (!property || !property.status) {
        toast.info('Property found but has no status information');
        setIsSyncing(false);
        setLoadingProperty(false);
        return;
      }
      
      const vaultStatus = property.status.toLowerCase();
      const newStatus = statusMap[vaultStatus];
      
      if (!newStatus) {
        toast.info(`Unknown VaultRE status: ${property.status}`);
        setIsSyncing(false);
        setLoadingProperty(false);
        return;
      }
      
      if (newStatus === referral.status) {
        toast.info(`Status already up to date: ${referral.status}`);
        setIsSyncing(false);
        setLoadingProperty(false);
        return;
      }
      
      const { error } = await supabase
        .from('referrals')
        .update({ status: newStatus })
        .eq('id', referral.id);
        
      if (error) {
        throw new Error(`Failed to update referral: ${error.message}`);
      }
      
      await supabase.from('referral_status_history').insert({
        referral_id: referral.id,
        previous_status: referral.status,
        new_status: newStatus,
        notes: `Automatically updated via VaultRE CRM sync. Property status: ${property.status}`,
        changed_by: 'system',
        user_full_name: null
      });
      
      // Update local state immediately
      const updatedReferralState = { ...referral, status: newStatus };
      setReferral(updatedReferralState);
      
      toast.success(`Status updated from ${referral.status} to ${newStatus}`);
      
      // After successful sync, refresh the property data from our database
      try {
        const { data: refreshedProperty, error: refreshError } = await supabase
          .from('properties')
          .select('*')
          .eq('vault_property_id', referral.vault_property_id)
          .single();
          
        if (!refreshError && refreshedProperty) {
          // Create ExtendedPropertyDetails from the refreshed data
          const propertyDetails: ExtendedPropertyDetails = {
            id: refreshedProperty.id,
            address: refreshedProperty.address?.display_address || 'Address Not Available',
            city: refreshedProperty.address?.suburb || '',
            state: refreshedProperty.address?.state || '',
            zip: refreshedProperty.address?.post_code || '',
            county: '',
            parcel_id: refreshedProperty.vault_property_id,
            status: refreshedProperty.status,
            property_type: refreshedProperty.property_type,
            price_text: refreshedProperty.price_text,
            address_obj: refreshedProperty.address
          };
          
          setLinkedProperty(propertyDetails);
        }
      } catch (refreshError) {
        // Just log the error, don't affect the main flow
        handleError(refreshError, {
          context: 'ReferralDetailsDialog.handleSyncStatus.refreshProperty',
          silent: true,
          showToast: false
        });
      }
      
      if (onSyncComplete) {
        // Pass back only status and ID as linkedProperty is handled locally
        onSyncComplete({ id: referral.id, status: newStatus }); 
      }
    } catch (error: unknown) {
      handleError(error, {
        context: 'ReferralDetailsDialog.handleSyncStatus',
        toastMessage: 'Failed to sync referral status',
        showToast: true
      });
      toast.error(error instanceof Error ? error.message : 'Failed to sync referral status');
    } finally {
      setIsSyncing(false);
      setLoadingProperty(false); // Finish loading
    }
  };

  // Handle status update with settlement dialog if needed
  const handleStatusUpdate = (referralId: string, newStatus: string) => {
    // Define statuses that require a property to be linked
    const statusesRequiringProperty = ['Appraised', 'Listed', 'Sold', 'Settled'];
    
    // Check if the new status requires a property AND there is no property linked
    if (statusesRequiringProperty.includes(newStatus) && !referral?.vault_property_id) {
      // Store the pending status change
      setPendingStatusChange({ referralId, status: newStatus });
      // Show the property warning dialog
      setIsPropertyWarningOpen(true);
    } else if (newStatus === 'Sold') {
      // Existing logic for Sold status
      setPendingStatusChange({ referralId, status: newStatus });
      setIsSettlementDialogOpen(true);
    } else {
      // For other statuses, just update normally
      onUpdateStatus(referralId, newStatus);
    }
  };
  
  // Handle settlement dialog confirmation
  const handleSettlementConfirm = async (settlementDate: Date, notes?: string) => {
    if (!pendingStatusChange || !referral) return;
    
    try {
      // Update referral with settlement date
      const { error } = await supabase
        .from('referrals')
        .update({ 
          status: pendingStatusChange.status,
          settlement_date: settlementDate.toISOString()
        })
        .eq('id', pendingStatusChange.referralId);
        
      if (error) {
        handleError(error, {
          context: 'ReferralDetailsDialog.handleSettlementConfirm',
          toastMessage: 'Failed to save settlement details',
          showToast: true
        });
        
        // Show a more user-friendly message
        if (error.message?.includes("Could not find the 'settlement_date' column")) {
          toast.error('Database schema needs to be updated. Please contact an administrator.');
        } else {
          toast.error(`Failed to save settlement details: ${error.message}`);
        }
        
        // Close the dialog despite the error to prevent user frustration
        setIsSettlementDialogOpen(false);
        setPendingStatusChange(null);
        return;
      }
      
      // Update local state immediately to show settlement date in UI
      setReferral({
        ...referral,
        status: pendingStatusChange.status,
        settlement_date: settlementDate.toISOString()
      });
      
      // Append notes if provided
      if (notes) {
        onStatusNoteChange(notes);
        await onAddNote(pendingStatusChange.referralId);
      }
      
      // Update status in parent component
      onUpdateStatus(pendingStatusChange.referralId, pendingStatusChange.status);
      
      // Notify parent component about status change
      if (onSyncComplete) {
        onSyncComplete({ 
          id: pendingStatusChange.referralId, 
          status: pendingStatusChange.status,
          settlement_date: settlementDate.toISOString()
        });
      }
      
      // Close dialog
      setIsSettlementDialogOpen(false);
      setPendingStatusChange(null);
      
      toast.success('Referral marked as Sold with settlement details');
    } catch (error: unknown) {
      handleError(error, {
        context: 'ReferralDetailsDialog.handleSettlementConfirm',
        toastMessage: 'Failed to save settlement details',
        showToast: true
      });
      toast.error('Failed to save settlement details. Please try again later.');
      
      // Close dialog despite the error
      setIsSettlementDialogOpen(false);
      setPendingStatusChange(null);
    }
  };
  
  // Handle settlement dialog cancellation
  const handleSettlementCancel = () => {
    setIsSettlementDialogOpen(false);
    setPendingStatusChange(null);
  };

  // Callback for when property linking is complete
  const handleLinkPropertyComplete = async (update: { vault_property_id: string, propertyDetails: ExtendedPropertyDetails }) => {
    if (referral) {
      setIsSaving(true);
      try {
        // Update the referral with the new vault_property_id
        const { error: referralUpdateError } = await supabase
          .from("referrals")
          .update({ vault_property_id: update.vault_property_id })
          .eq("id", referral.id);

        if (referralUpdateError) throw referralUpdateError;
        
        // Also update the property to link it back to this referral
        const { data: existingProperty, error: propertyCheckError } = await supabase
          .from("properties")
          .select("id")
          .eq("vault_property_id", update.vault_property_id)
          .single();
          
        if (!propertyCheckError && existingProperty) {
          // If property exists, update its referral_id
          const { error: propertyUpdateError } = await supabase
            .from("properties")
            .update({ referral_id: referral.id })
            .eq("vault_property_id", update.vault_property_id);
            
          if (propertyUpdateError) {
            handleError(propertyUpdateError, {
              context: 'ReferralDetailsDialog.handleLinkPropertyComplete.updateProperty',
              toastMessage: 'Warning: Property updated but referral link may not be complete',
              showToast: false,
              silent: true
            });
          }
        }
        
        // Update local referral state with the new vault_property_id
        const updatedReferral = { ...referral, vault_property_id: update.vault_property_id };
        setReferral(updatedReferral);
        
        // Update local linked property state with the details passed back
        setLinkedProperty(update.propertyDetails);
        setIsLinkPropertyDialogOpen(false); // Close the dialog
        
        // Check if we came from property warning - if so, update the status too
        if (pendingStatusChange) {
          // For "Sold" status, we need to open the settlement dialog
          if (pendingStatusChange.status === 'Sold') {
            setIsSettlementDialogOpen(true);
          } else {
            // For other statuses requiring property, update immediately
            onUpdateStatus(pendingStatusChange.referralId, pendingStatusChange.status);
            setPendingStatusChange(null);
          }
        }
        
        // Optionally call onSyncComplete or a similar prop to notify the parent
        if (onSyncComplete) {
          onSyncComplete(updatedReferral); 
        }
      } catch (error: unknown) {
        handleError(error, {
          context: 'ReferralDetailsDialog.handleLinkPropertyComplete',
          toastMessage: 'Error linking property to referral',
          showToast: true
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Callback for when partner linking is complete
  const handleLinkPartnerComplete = async (update: { referrer_id: string, partnerDetails: Partner }) => {
    if (referral) {
      try {
        // Immediately update local state for good UX
        setPartnerDetails(update.partnerDetails);
        
        // Update local referral state with the new referrer_id
        const updatedReferral = { 
          ...referral, 
          referrer_id: update.referrer_id,
        };
        setReferral(updatedReferral);
        
        // Close the dialog early for better UX
        setIsLinkReferrerDialogOpen(false);
        
        // Fetch the full partner details from database to ensure we have accurate data
        const { data: freshPartnerData, error } = await supabase
          .from('referrers')
          .select('id, full_name, email, phone')
          .eq('id', update.referrer_id)
          .single();
          
        if (error) {
          handleError(error, {
            context: 'ReferralDetailsDialog.handleLinkPartnerComplete',
            toastMessage: 'Error fetching partner details',
            showToast: false
          });
          // Continue with the local data we already have
        } else if (freshPartnerData) {
          // Update with the fresh data from database
          setPartnerDetails(freshPartnerData);
        }
        
        // Notify the parent component
        if (onSyncComplete) {
          onSyncComplete({
            id: referral.id,
            referrer_id: update.referrer_id
          });
        }
      } catch (error: unknown) {
        handleError(error, {
          context: 'ReferralDetailsDialog.handleLinkPartnerComplete',
          toastMessage: 'Error in partner linking process',
          showToast: true
        });
        toast.error("There was an issue updating partner details. Please try refreshing.");
      }
    }
  };

  // Add handlers for unlinking property and partner
  const handleUnlinkProperty = async () => {
    if (!referral?.id) return;
    setIsSaving(true);
    try {
      // Update the database
      const { error } = await supabase
        .from("referrals")
        .update({ vault_property_id: null })
        .eq("id", referral.id);

      if (error) throw error;

      // Update local state
      setLinkedProperty(null);
      if (referral) {
        setReferral({
          ...referral,
          vault_property_id: undefined,
        });
      }

      // Notify the parent component
      if (onSyncComplete) {
        onSyncComplete({
          id: referral.id,
          vault_property_id: undefined,
        });
      }

      toast.success("Property unlinked successfully");
    } catch (error: unknown) {
      handleError(error, {
        context: 'ReferralDetailsDialog.handleUnlinkProperty',
        toastMessage: 'Error unlinking property',
        showToast: true
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUnlinkPartner = async () => {
    if (!referral?.id) return;
    setIsSaving(true);
    try {
      // Update the database
      const { error } = await supabase
        .from("referrals")
        .update({ referrer_partner_id: null })
        .eq("id", referral.id);

      if (error) throw error;

      // Update local state
      setPartnerDetails(null);
      if (referral) {
        setReferral({
          ...referral,
          referrer_id: undefined,
          referrers: undefined
        });
      }

      // Notify the parent component
      if (onSyncComplete) {
        onSyncComplete({
          id: referral.id,
          referrer_id: undefined,
        });
      }

      toast.success("Partner unlinked successfully");
    } catch (error: unknown) {
      handleError(error, {
        context: 'ReferralDetailsDialog.handleUnlinkPartner',
        toastMessage: 'Error unlinking partner',
        showToast: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle property linking from warning dialog
  const handlePropertyWarningConfirm = () => {
    setIsPropertyWarningOpen(false);
    setIsLinkPropertyDialogOpen(true);
  };
  
  // Handle cancellation of property warning
  const handlePropertyWarningCancel = () => {
    setIsPropertyWarningOpen(false);
    setPendingStatusChange(null);
  };

  React.useEffect(() => {
    if (pendingStatusChange === null) {
      setIsPropertyWarningOpen(false);
    }
  }, [pendingStatusChange]);
  
  // Render the settlement date if available
  const renderSettlementDate = () => {
    if (!referral?.settlement_date) return null;
    
    try {
      // Parse the date but don't store in variable if not using it
      parseISO(referral.settlement_date);
      const formattedDate = formatDate(referral.settlement_date);
      const daysAway = calculateDaysAway(referral.settlement_date);
      
      return (
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium">Settlement Date:</span>
          <span className="text-sm">
            {formattedDate} <span className="text-muted-foreground">{daysAway}</span>
          </span>
        </div>
      );
    } catch (error) {
      handleError(error, {
        context: 'ReferralDetailsDialog.renderSettlementDate',
        toastMessage: 'Error formatting settlement date',
        showToast: false,
        silent: true
      });
      return null;
    }
  };

  // Fix the display logic
  const renderPropertyAddress = (property: ExtendedPropertyDetails) => {
    // Direct handling of our database structure
    if (property.address_obj) {
      // First check postal_address which is the most complete format
      if (property.address_obj.postal_address) {
        return property.address_obj.postal_address;
      }
      
      // Next try display_address
      if (property.address_obj.display_address) {
        return property.address_obj.display_address;
      }
      
      // Next try to combine components
      const parts = [];
      if (property.address_obj.street_address) parts.push(property.address_obj.street_address);
      if (property.address_obj.suburb) parts.push(property.address_obj.suburb);
      if (property.address_obj.state) parts.push(property.address_obj.state);
      if (property.address_obj.post_code) parts.push(property.address_obj.post_code);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    // Fallback to simple address string
    if (property.address) {
      return property.address;
    }
    
    return 'N/A';
  };

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
            
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold mb-2">Referee Information</h3>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">Name:</span> {referral.referee_name}</p>
                      <p><span className="font-medium text-foreground">Email:</span> {referral.referee_email}</p>
                      <p><span className="font-medium text-foreground">Phone:</span> {referral.referee_phone}</p>
                      {referral.referee_address?.display_address && (
                        <p><span className="font-medium text-foreground">Address:</span> {referral.referee_address.display_address}</p>
                      )}
                      <p><span className="font-medium text-foreground">Type:</span> {referral.referee_type.charAt(0).toUpperCase() + referral.referee_type.slice(1)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold">Partner Information</h3>
                    </div>
                    {partnerDetails ? (
                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium text-foreground">Name:</span> {partnerDetails.full_name}</p>
                          <p><span className="font-medium text-foreground">Email:</span> {partnerDetails.email}</p>
                          <p><span className="font-medium text-foreground">Phone:</span> {partnerDetails.phone}</p>
                          <div className="pt-1">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={handleUnlinkPartner}
                              className="text-xs h-7 px-2 text-muted-foreground"
                            >
                              Unlink Partner
                            </Button>
                          </div>
                        </div>
                    ) : referral?.referrers ? (
                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium text-foreground">Name:</span> {referral.referrers.full_name}</p>
                          <p><span className="font-medium text-foreground">Email:</span> {referral.referrers.email}</p>
                          <p><span className="font-medium text-foreground">Phone:</span> {referral.referrers.phone}</p>
                          <div className="pt-1">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={handleUnlinkPartner}
                              className="text-xs h-7 px-2 text-muted-foreground"
                            >
                              Unlink Partner
                            </Button>
                          </div>
                        </div>
                    ) : referral?.referrer_id ? (
                        <p className="text-sm text-muted-foreground">Partner details not loaded.</p>
                    ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">No partner linked to this referral.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsLinkReferrerDialogOpen(true)}
                            className="mt-1"
                          >
                            Link Partner
                          </Button>
                        </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold mb-2">Referral Details</h3>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">Created:</span> {formatDate(referral.created_at)}</p>
                      <div className="flex items-center">
                        <span className="font-medium text-foreground">Status:</span>
                        <Badge className={`ml-2 ${getStatusBadgeClass(referral.status)}`}>
                          {referral.status || 'New'}
                        </Badge>
                      </div>
                      {renderSettlementDate()}
                    </div>
                  </div>
                  
                  {referral.situation_description && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Situation Description</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{referral.situation_description}</p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold">Linked Property</h3>
                      {/* Show Sync button only if a property ID exists and the property is loaded */}
                      {referral.vault_property_id && linkedProperty && (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleSyncStatus}
                            disabled={isSyncing || loadingProperty}
                            className="h-7 px-2 text-xs"
                            title="Re-sync property details from VaultRE"
                          >
                            {isSyncing || loadingProperty ? (
                              <Loader2 className="h-3 w-3 mr-1" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            <span>Sync</span>
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={handleUnlinkProperty}
                            disabled={isSaving}
                          >
                            Unlink
                          </Button>
                        </div>
                      )}
                    </div>
                    {loadingProperty ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading property details...</span>
                      </div>
                    ) : linkedProperty ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Address:</span> {renderPropertyAddress(linkedProperty)}</p>
                        <p><span className="font-medium text-foreground">Status:</span> {(linkedProperty.status && linkedProperty.status.charAt(0).toUpperCase() + linkedProperty.status.slice(1)) || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Type:</span> {linkedProperty.property_type || 'N/A'}</p>
                        <p><span className="font-medium text-foreground">Price:</span> {linkedProperty.price_text || 'N/A'}</p>
                      </div>
                    ) : referral.vault_property_id ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Property details not loaded.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleSyncStatus}
                          disabled={isSyncing || loadingProperty}
                          className="mt-1"
                        >
                          {isSyncing || loadingProperty ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sync Property
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">No property linked to this referral.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsLinkPropertyDialogOpen(true)}
                          disabled={isSaving}
                        >
                          Link Property
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-base font-semibold mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {getStatusOptionsForType(referral.referee_type).map((status) => {
                    // Get the badge class for status-specific styling
                    const badgeClass = getStatusBadgeClass(status);
                    const isActive = referral.status === status;
                    
                    return (
                      <Button
                        key={status}
                        // Use 'ghost' for active to avoid bg conflict, 'outline' for inactive
                        variant={isActive ? "ghost" : "outline"} 
                        size="sm"
                        onClick={() => handleStatusUpdate(referral.id, status)}
                        // Apply badgeClass for base active style. Add opacity hover.
                        // For inactive, rely on standard outline variant styling.
                        className={isActive ? cn(badgeClass, "hover:opacity-90 border border-transparent") : ""} 
                      >
                        {status}
                      </Button>
                    );
                  })}
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
                  {statusHistory
                    // Filter out entries that are likely duplicates (no user_full_name AND no notes)
                    .filter(item => item.user_full_name || item.notes || item.changed_by === 'system')
                    .map((item) => (
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
                              {item.changed_by === 'system' ? (
                                <span className="font-medium ml-1">from CRM Sync</span>
                              ) : item.user_full_name ? (
                                <span className="font-medium ml-1">by {item.user_full_name}</span>
                              ) : null}
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
      
      {/* Property warning dialog */}
      <AlertDialog open={isPropertyWarningOpen} onOpenChange={setIsPropertyWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Property Required</AlertDialogTitle>
            <AlertDialogDescription>
              A property must be linked to this referral before it can be marked as {pendingStatusChange?.status}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePropertyWarningCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePropertyWarningConfirm}>Link Property</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {isSettlementDialogOpen && (
        <SettlementDialog
          open={isSettlementDialogOpen}
          onOpenChange={setIsSettlementDialogOpen}
          onConfirm={handleSettlementConfirm}
          onCancel={handleSettlementCancel}
        />
      )}
      
      {/* Add the LinkPropertyDialog instance */}
      {isLinkPropertyDialogOpen && (
        <LinkPropertyDialog
          referralId={referral.id}
          open={isLinkPropertyDialogOpen}
          onOpenChange={setIsLinkPropertyDialogOpen}
          onLinkComplete={({ vault_property_id, propertyDetails }) => {
            // Convert PropertyDetails to ExtendedPropertyDetails with a proper address_obj structure
            const extendedDetails: ExtendedPropertyDetails = {
              ...propertyDetails,
              status: undefined,
              property_type: undefined,
              price_text: undefined,
              address_obj: {
                display_address: propertyDetails.address,
                // Add any address components we might have
                street_address: propertyDetails.address, // Best guess
                suburb: propertyDetails.city,
                state: propertyDetails.state,
                post_code: propertyDetails.zip
              }
            };
            
            // Fetch the full property details from the database to ensure we have accurate data
            supabase
              .from('properties')
              .select('*')
              .eq('vault_property_id', vault_property_id)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  handleError(error, {
                    context: 'ReferralDetailsDialog.linkProperty',
                    toastMessage: 'Error fetching complete property details',
                    showToast: false,
                    silent: true
                  });
                  // Continue with the basic property data we already have
                  handleLinkPropertyComplete({
                    vault_property_id,
                    propertyDetails: extendedDetails
                  });
                } else if (data) {
                  // If we found property data, create a more complete ExtendedPropertyDetails
                  const fullPropertyDetails: ExtendedPropertyDetails = {
                    ...extendedDetails,
                    // Use exact values from the database
                    status: data.status,
                    property_type: data.property_type,
                    price_text: data.price_text,
                    // Use the address object directly from the database
                    address_obj: data.address || { display_address: propertyDetails.address }
                  };
                  
                  handleLinkPropertyComplete({
                    vault_property_id,
                    propertyDetails: fullPropertyDetails
                  });
                } else {
                  // If no property found, fall back to the basic details
                  handleLinkPropertyComplete({
                    vault_property_id,
                    propertyDetails: extendedDetails
                  });
                }
              });
          }}
        />
      )}
      
      {/* Add the LinkReferrerDialog instance */}
      {isLinkReferrerDialogOpen && (
        <LinkReferrerDialog
          referralId={referral.id}
          open={isLinkReferrerDialogOpen}
          onOpenChange={setIsLinkReferrerDialogOpen}
          onLinkComplete={(update: { 
            referrer_id: string;
            partnerDetails: Partner;
          }) => {
            // Pass the update object directly as it now matches the expected Partner type
            handleLinkPartnerComplete(update);
          }}
        />
      )}
    </Dialog>
  );
};

export default ReferralDetailsDialog; 
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/context/AuthContext'
import supabase from '@/lib/supabase'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

// Define the form schema for partner information
const adminPartnerFormSchema = z.object({
  email: z.string().email({ message: 'Valid email address is required' }),
  full_name: z.string().min(2, { message: 'Full name is required' }),
  phone: z.string().optional(),
  is_business: z.boolean().default(false),
  business_name: z.string().optional(),
  partner_code: z.string().optional(),
})
.superRefine((data, ctx) => {
  // Only validate business fields if is_business is true
  if (data.is_business) {
    // Check business_name
    if (!data.business_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business name is required for business partners",
        path: ["business_name"]
      });
    }
    
    // Check partner_code
    if (!data.partner_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner code is required for business partners",
        path: ["partner_code"]
      });
    } else if (data.partner_code.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: "string",
        inclusive: true,
        message: "Partner code must be at least 3 characters",
        path: ["partner_code"]
      });
    } else if (data.partner_code.length > 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 8,
        type: "string",
        inclusive: true,
        message: "Partner code must not exceed 8 characters",
        path: ["partner_code"]
      });
    } else if (!/^[A-Z0-9]+$/.test(data.partner_code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner code must contain only letters A-Z and numbers 0-9",
        path: ["partner_code"]
      });
    }
  }
});

type AdminPartnerFormValues = z.infer<typeof adminPartnerFormSchema>;

interface AdminPartnerFormProps {
  onSubmitSuccess?: () => void;
  triggerButton?: React.ReactNode;
  onViewPartner?: (partnerId: string) => void;
}

type PartnerData = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_business?: boolean;
  business_name?: string;
  partner_code?: string;
  active: boolean;
};

export function AdminPartnerForm({ onSubmitSuccess, triggerButton, onViewPartner }: AdminPartnerFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [existingPartner, setExistingPartner] = useState<PartnerData | null>(null);
  const [partnerFieldsDisabled, setPartnerFieldsDisabled] = useState(true);
  const [partnerCodeValid, setPartnerCodeValid] = useState<boolean | null>(null);
  const [partnerCodeChecking, setPartnerCodeChecking] = useState(false);
  const [invalidCharDetected, setInvalidCharDetected] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [newPartnerFound, setNewPartnerFound] = useState(false);

  const form = useForm<AdminPartnerFormValues>({
    resolver: zodResolver(adminPartnerFormSchema),
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      is_business: false,
      business_name: '',
      partner_code: '',
    },
    mode: 'onSubmit',
  });

  // Helper to check if a partner code is unique
  const checkPartnerCodeUnique = async (code: string): Promise<boolean> => {
    if (!code || code.length < 3) return false;
    
    setPartnerCodeChecking(true);
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('id')
        .eq('partner_code', code);
      
      if (error) throw error;
      
      // If the only match is the current partner, it's still valid
      if (existingPartner && data.length === 1 && data[0].id === existingPartner.id) {
        return true;
      }
      
      // Otherwise, it should not exist in the database
      return data.length === 0;
    } catch (error) {
      console.error('Error checking partner code:', error);
      return false;
    } finally {
      setPartnerCodeChecking(false);
    }
  };

  // Check for invalid characters in partner code
  const checkInvalidChars = (code: string): boolean => {
    return !/^[A-Z0-9]*$/.test(code);
  };

  // Force uppercase and handle input restrictions for partner code
  const handlePartnerCodeChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (...event: any[]) => void) => {
    const value = e.target.value.toUpperCase();
    
    // Check for invalid characters
    const hasInvalidChars = checkInvalidChars(value);
    setInvalidCharDetected(hasInvalidChars);
    
    // If there are invalid chars, clear the valid state
    if (hasInvalidChars) {
      setPartnerCodeValid(null);
    }
    
    // Update the field value
    onChange(value);
  };
  
  // Handle partner code blur event
  const handlePartnerCodeBlur = async (code: string) => {
    // If there are invalid chars, don't bother checking uniqueness
    if (checkInvalidChars(code)) {
      setInvalidCharDetected(true);
      setPartnerCodeValid(null);
      return;
    }
    
    if (code && code.length >= 3) {
      const isUnique = await checkPartnerCodeUnique(code);
      setPartnerCodeValid(isUnique);
      
      if (!isUnique) {
        form.setError('partner_code', {
          type: 'manual',
          message: 'This partner code is already in use',
        });
      } else {
        form.clearErrors('partner_code');
      }
    }
  };
  
  // Handle partner code keydown event
  const handlePartnerCodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, code: string) => {
    if (e.key === 'Enter' && code && code.length >= 3 && !checkInvalidChars(code)) {
      e.preventDefault();
      await handlePartnerCodeBlur(code);
    }
  };

  // Watch for changes to the partner email field
  const partnerEmail = form.watch('email');
  
  // Function to look up partner by email
  const lookupPartner = async () => {
    if (!partnerEmail || !partnerEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setEmailChecking(true);
    setNewPartnerFound(false); // Reset new partner status
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('email', partnerEmail)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No partner found with this email
          setExistingPartner(null);
          setPartnerFieldsDisabled(false);
          setNewPartnerFound(true); // Set new partner status
          form.setValue('full_name', '');
          form.setValue('phone', '');
          form.setValue('is_business', false);
          form.setValue('business_name', '');
          form.setValue('partner_code', '');
        } else {
          throw error;
        }
      } else if (data) {
        // Partner found, populate form with basic info but don't enable editing
        setExistingPartner(data);
        form.setValue('full_name', data.full_name || '');
        form.setValue('phone', data.phone || '');
        form.setValue('is_business', data.is_business || false);
        form.setValue('business_name', data.business_name || '');
        form.setValue('partner_code', data.partner_code || '');
        setPartnerFieldsDisabled(true);
      }
    } catch (error) {
      console.error('Error checking partner:', error);
      toast.error("There was a problem checking this email. Please try again.");
    } finally {
      setEmailChecking(false);
    }
  };

  // Handle view existing partner
  const handleViewPartner = () => {
    if (existingPartner && onViewPartner) {
      setOpen(false);
      onViewPartner(existingPartner.id);
    }
  };

  // Reset partner fields when editing
  const handleEditPartner = () => {
    setPartnerFieldsDisabled(false);
    // Keep the existing partner ID for later update
  };

  // Clear form errors when dialog opens/closes
  useEffect(() => {
    setFormErrors([]);
  }, [open]);

  async function onSubmit(data: AdminPartnerFormValues) {
    // Clear any previous form errors
    setFormErrors([]);
    
    if (!user) {
      toast.error("You must be logged in to add partners.");
      return;
    }
    
    // Additional validation for business partners
    if (data.is_business) {
      const errors = [];
      if (!data.business_name) errors.push("Business name is required");
      if (!data.partner_code) errors.push("Partner code is required");
      
      if (errors.length > 0) {
        setFormErrors(errors);
        toast.error("Please fill in all required business partner fields");
        return;
      }
      
      // Verify partner code is valid and unique
      if (data.partner_code && partnerCodeValid === false) {
        toast.error("This partner code is already in use. Please choose another.");
        return;
      }
    }
    
    setSubmitting(true);
    try {      
      // If we found an existing partner, update it
      if (existingPartner) {        
        // If fields were edited, update the partner
        if (!partnerFieldsDisabled) {
          const { error: updateError } = await supabase
            .from('referrers')
            .update({
              full_name: data.full_name,
              phone: data.phone,
              is_business: data.is_business,
              business_name: data.is_business ? data.business_name : null,
              partner_code: data.is_business ? data.partner_code : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPartner.id);
          
          if (updateError) {
            throw updateError;
          }
          
          toast.success("Partner updated successfully");
        } else {
          toast.info("No changes made to existing partner");
        }
      } else {
        // Create a new partner
        const { error: insertError } = await supabase
          .from('referrers')
          .insert({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            is_business: data.is_business,
            business_name: data.is_business ? data.business_name : null,
            partner_code: data.is_business ? data.partner_code : null,
            created_at: new Date().toISOString(),
            partnership_start_date: new Date().toISOString(),
            active: true
          })
          .select();
        
        if (insertError) {
          console.error('Error creating partner:', insertError);
          throw new Error('Failed to create partner. Please contact support.');
        }
        
        toast.success("Partner added successfully");
      }
      
      // Reset form
      form.reset({
        email: '',
        full_name: '',
        phone: '',
        is_business: false,
        business_name: '',
        partner_code: '',
      });
      
      // Reset state
      setExistingPartner(null);
      setPartnerFieldsDisabled(true);
      setPartnerCodeValid(null);
      
      // Close dialog
      setOpen(false);
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting partner:', error);
      toast.error(error.message || "There was a problem saving the partner. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  
  // Handle form submission errors
  const handleFormSubmit = form.handleSubmit(
    onSubmit,
    (errors) => {
      console.error('Form validation errors:', errors);
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error.message}`)
        .filter(Boolean);
      
      setFormErrors(errorMessages);
      
      toast.error("Please fix the form errors before submitting");
    }
  );

  // Reset function to handle opening the dialog
  const handleOpenDialog = () => {
    // Reset form state when opening
    form.reset({
      email: '',
      full_name: '',
      phone: '',
      is_business: false,
      business_name: '',
      partner_code: '',
    });
    
    setExistingPartner(null);
    setPartnerFieldsDisabled(true);
    setPartnerCodeValid(null);
    setInvalidCharDetected(false);
    setFormErrors([]);
    setNewPartnerFound(false);
    setOpen(true);
  };

  // Function to handle dialog state changes
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen && submitting) {
      // Don't close if submitting
      return;
    }
    
    setOpen(isOpen);
    
    if (!isOpen) {
      // Clean up when closing
      setFormErrors([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button 
            variant="default"
            onClick={handleOpenDialog}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingPartner ? "Partner Found" : "Add New Partner"}
          </DialogTitle>
          <DialogDescription>
            {existingPartner 
              ? "This partner already exists in the system." 
              : "Add a new partner to the system. Fields marked with * are required."
            }
          </DialogDescription>
        </DialogHeader>
        
        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h4>
            <ul className="text-xs text-red-700 list-disc list-inside">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {existingPartner ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">{existingPartner.is_business ? existingPartner.business_name : existingPartner.full_name}</h3>
              <p className="text-sm text-muted-foreground">{existingPartner.email}</p>
              {existingPartner.phone && (
                <p className="text-sm text-muted-foreground">{existingPartner.phone}</p>
              )}
            </div>
            <Button 
              onClick={handleViewPartner}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              View Partner Details
            </Button>
            <button 
              type="button"
              onClick={() => {
                form.setValue('email', '');
                setExistingPartner(null);
                setPartnerFieldsDisabled(false);
              }}
              className="text-sm text-black hover:underline dark:text-white mt-2"
            >
              Go Back
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-lg">Partner Information</h3>
                <Separator />
                
                <div className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="partner@example.com" 
                            {...field} 
                            disabled={emailChecking || submitting || existingPartner !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={lookupPartner}
                    disabled={emailChecking || submitting || existingPartner !== null || !form.getValues('email')}
                  >
                    {emailChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
                  </Button>
                </div>
                
                {existingPartner && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Partner found in system
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleEditPartner}
                      disabled={submitting}
                    >
                      Edit
                    </Button>
                  </div>
                )}
                
                {newPartnerFound && (
                  <div className="text-sm text-muted-foreground mt-1 mb-2">
                    New partner email. Please fill in the partner details below.
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          disabled={partnerFieldsDisabled || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(123) 456-7890" 
                          {...field} 
                          disabled={partnerFieldsDisabled || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_business"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Partner Type *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                          className="flex space-x-4"
                          disabled={partnerFieldsDisabled || submitting}
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="false" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Individual
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="true" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Business
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('is_business') && (
                  <>
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Acme Corporation" 
                              {...field} 
                              disabled={partnerFieldsDisabled || submitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="partner_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner Code *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="ABC123" 
                                maxLength={8}
                                {...field}
                                value={field.value ? field.value.toUpperCase() : ''}
                                onChange={(e) => handlePartnerCodeChange(e, field.onChange)}
                                onBlur={() => handlePartnerCodeBlur(field.value || '')}
                                onKeyDown={(e) => handlePartnerCodeKeyDown(e, field.value || '')}
                                className={`pr-9 ${
                                  invalidCharDetected ? 'border-red-500' :
                                  partnerCodeValid === false ? 'border-red-500' :
                                  partnerCodeValid === true ? 'border-green-500' : ''
                                }`}
                                disabled={partnerFieldsDisabled || submitting}
                              />
                              {partnerCodeChecking && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              {partnerCodeValid === true && !partnerCodeChecking && !invalidCharDetected && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className={invalidCharDetected ? 'text-red-500' : ''}>
                            3-8 alphanumeric characters (A-Z, 0-9)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  {submitting ? "Saving..." : "Add Partner"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 
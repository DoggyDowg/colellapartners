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
import { Textarea } from '@/components/ui/textarea'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PlusCircle, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

// Define the form schema based on the database structure
const adminReferralFormSchema = z.object({
  // Referrer information section
  referrer_email: z.string().email({ message: 'Valid email address is required' }),
  referrer_name: z.string().min(2, { message: 'Full name is required' }),
  referrer_phone: z.string().optional(),
  is_business: z.boolean().default(false),
  business_name: z.string().optional(),
  partner_code: z.string().optional(),
  
  // Referee information section (same as partner form)
  referee_name: z.string().min(2, { message: 'Referee name is required' }),
  referee_phone: z.string().optional(),
  referee_email: z.string().email({ message: 'Invalid email address' }).optional(),
  referee_type: z.enum(['seller', 'landlord'], { 
    required_error: 'Please select a referral type' 
  }),
  situation_description: z.string().optional(),
  additional_notes: z.string().optional(),
  contact_consent: z.boolean().default(false),
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

type AdminReferralFormValues = z.infer<typeof adminReferralFormSchema>;

interface AdminReferralFormProps {
  onSubmitSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

type ReferrerData = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_business?: boolean;
  business_name?: string;
  partner_code?: string;
};

export function AdminReferralForm({ onSubmitSuccess, triggerButton }: AdminReferralFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [existingReferrer, setExistingReferrer] = useState<ReferrerData | null>(null);
  const [referrerFieldsDisabled, setReferrerFieldsDisabled] = useState(true);
  const [partnerCodeValid, setPartnerCodeValid] = useState<boolean | null>(null);
  const [partnerCodeChecking, setPartnerCodeChecking] = useState(false);
  const [invalidCharDetected, setInvalidCharDetected] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [newPartnerFound, setNewPartnerFound] = useState(false);

  const form = useForm<AdminReferralFormValues>({
    resolver: zodResolver(adminReferralFormSchema),
    defaultValues: {
      referrer_email: '',
      referrer_name: '',
      referrer_phone: '',
      is_business: false,
      business_name: '',
      partner_code: '',
      referee_name: '',
      referee_phone: '',
      referee_email: '',
      referee_type: 'seller',
      situation_description: '',
      additional_notes: '',
      contact_consent: false,
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
      
      // If the only match is the current referrer, it's still valid
      if (existingReferrer && data.length === 1 && data[0].id === existingReferrer.id) {
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

  // Watch for changes to the referrer email field
  const referrerEmail = form.watch('referrer_email');
  
  // Function to look up referrer by email
  const lookupReferrer = async () => {
    if (!referrerEmail || !referrerEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setEmailChecking(true);
    setNewPartnerFound(false); // Reset new partner status
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('email', referrerEmail)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No referrer found with this email
          setExistingReferrer(null);
          setReferrerFieldsDisabled(false);
          setNewPartnerFound(true); // Set new partner status
          form.setValue('referrer_name', '');
          form.setValue('referrer_phone', '');
          form.setValue('is_business', false);
          form.setValue('business_name', '');
          form.setValue('partner_code', '');
        } else {
          throw error;
        }
      } else if (data) {
        // Referrer found, populate the form
        setExistingReferrer(data);
        form.setValue('referrer_name', data.full_name || '');
        form.setValue('referrer_phone', data.phone || '');
        form.setValue('is_business', data.is_business || false);
        form.setValue('business_name', data.business_name || '');
        form.setValue('partner_code', data.partner_code || '');
        setReferrerFieldsDisabled(true);
      }
    } catch (error) {
      console.error('Error checking referrer:', error);
      toast({
        title: "Lookup error",
        description: "There was a problem checking this email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEmailChecking(false);
    }
  };

  // Reset referrer fields when editing
  const handleEditReferrer = () => {
    setReferrerFieldsDisabled(false);
    setExistingReferrer(null);
  };

  // Clear form errors when dialog opens/closes
  useEffect(() => {
    setFormErrors([]);
  }, [open]);

  async function onSubmit(data: AdminReferralFormValues) {
    // Clear any previous form errors
    setFormErrors([]);
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit referrals.",
        variant: "destructive"
      });
      return;
    }
    
    // Additional validation for business partners
    if (data.is_business) {
      const errors = [];
      if (!data.business_name) errors.push("Business name is required");
      if (!data.partner_code) errors.push("Partner code is required");
      
      if (errors.length > 0) {
        setFormErrors(errors);
        toast({
          title: "Validation Error",
          description: "Please fill in all required business partner fields",
          variant: "destructive"
        });
        return;
      }
      
      // Verify partner code is valid and unique
      if (data.partner_code && partnerCodeValid === false) {
        toast({
          title: "Invalid Partner Code",
          description: "This partner code is already in use. Please choose another.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSubmitting(true);
    try {
      let referrerId: string;
      
      // If we found an existing referrer, use that ID
      if (existingReferrer) {
        referrerId = existingReferrer.id;
        
        // If fields were edited, update the referrer
        if (!referrerFieldsDisabled) {
          const { error: updateError } = await supabase
            .from('referrers')
            .update({
              full_name: data.referrer_name,
              phone: data.referrer_phone,
              is_business: data.is_business,
              business_name: data.is_business ? data.business_name : null,
              partner_code: data.is_business ? data.partner_code : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', referrerId);
          
          if (updateError) {
            throw updateError;
          }
        }
      } else {
        // Create a new referrer
        const { data: newReferrer, error: insertError } = await supabase
          .from('referrers')
          .insert({
            full_name: data.referrer_name,
            email: data.referrer_email,
            phone: data.referrer_phone,
            is_business: data.is_business,
            business_name: data.is_business ? data.business_name : null,
            partner_code: data.is_business ? data.partner_code : null,
            created_at: new Date().toISOString(),
            active: true
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error('Error creating referrer:', insertError);
          throw new Error('Failed to create partner profile. Please contact support.');
        }
        
        if (!newReferrer) {
          throw new Error('Failed to create partner profile. Please contact support.');
        }
        
        referrerId = newReferrer.id;
      }
      
      // Now create the referral with the referrer_id
      const referralRecord = {
        referrer_id: referrerId,
        referee_name: data.referee_name,
        referee_email: data.referee_email,
        referee_phone: data.referee_phone,
        referee_type: data.referee_type,
        situation_description: data.situation_description,
        additional_notes: data.additional_notes,
        contact_consent: data.contact_consent,
        status: 'New', // Default status for new referrals
        created_at: new Date().toISOString()
      };
      
      // Submit to the database
      const { error } = await supabase
        .from('referrals')
        .insert(referralRecord);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Referral submitted",
        description: "The referral has been successfully submitted!",
      });
      
      // Reset form
      form.reset({
        referrer_email: '',
        referrer_name: '',
        referrer_phone: '',
        is_business: false,
        business_name: '',
        partner_code: '',
        referee_name: '',
        referee_phone: '',
        referee_email: '',
        referee_type: 'seller',
        situation_description: '',
        additional_notes: '',
        contact_consent: false,
      });
      
      // Reset state
      setExistingReferrer(null);
      setReferrerFieldsDisabled(true);
      setPartnerCodeValid(null);
      
      // Close dialog
      setOpen(false);
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting referral:', error);
      toast({
        title: "Submission failed",
        description: error.message || "There was a problem submitting the referral. Please try again.",
        variant: "destructive"
      });
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
      
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive"
      });
    }
  );

  // Reset function to handle opening the dialog
  const handleOpenDialog = () => {
    // Reset form state when opening
    form.reset({
      referrer_email: '',
      referrer_name: '',
      referrer_phone: '',
      is_business: false,
      business_name: '',
      partner_code: '',
      referee_name: '',
      referee_phone: '',
      referee_email: '',
      referee_type: 'seller',
      situation_description: '',
      additional_notes: '',
      contact_consent: false,
    });
    
    setExistingReferrer(null);
    setReferrerFieldsDisabled(true);
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
            size="sm"
            onClick={handleOpenDialog}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            New Referral
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">New Admin Referral</DialogTitle>
          <DialogDescription>
            Create a new referral for a partner. Fields marked with * are required.
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
        
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Referrer Section */}
            <div className="space-y-4 pt-2">
              <h3 className="font-medium text-lg">Referrer Details</h3>
              <Separator />
              
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="referrer_email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="partner@example.com" 
                          {...field} 
                          disabled={emailChecking || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={lookupReferrer}
                  disabled={emailChecking || submitting || !form.getValues('referrer_email')}
                >
                  {emailChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
                </Button>
              </div>
              
              {existingReferrer && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Partner found in system
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleEditReferrer}
                    disabled={submitting}
                  >
                    Edit
                  </Button>
                </div>
              )}
              
              {newPartnerFound && (
                <div className="text-sm text-muted-foreground mt-1 mb-2">
                  New partner detected. Please fill in the partner details below.
                </div>
              )}
              
              <FormField
                control={form.control}
                name="referrer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        disabled={referrerFieldsDisabled || submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="referrer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(123) 456-7890" 
                        {...field} 
                        disabled={referrerFieldsDisabled || submitting}
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
                        disabled={referrerFieldsDisabled || submitting}
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
                            disabled={referrerFieldsDisabled || submitting}
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
                              disabled={referrerFieldsDisabled || submitting}
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
            
            {/* Referee Section */}
            <div className="space-y-4 pt-4">
              <h3 className="font-medium text-lg">Referral Details</h3>
              <Separator />
              
              <FormField
                control={form.control}
                name="referee_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referee_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="referee_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="referee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Type *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a referral type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="landlord">Landlord</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="situation_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the client's situation..." 
                        {...field}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="additional_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any other relevant information..." 
                        {...field}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-black data-[state=checked]:text-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black border-gray-400 dark:border-gray-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Contact Consent
                      </FormLabel>
                      <FormDescription>
                        The referred person has consented to being contacted.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold"
              >
                {submitting ? "Submitting..." : "Submit Referral"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
'use client'

import { useState } from 'react'
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
import { CircleDollarSign } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Define the form schema based on the database structure
const partnerReferralFormSchema = z.object({
  referee_name: z.string().min(2, { message: 'Referee name is required' }),
  referee_phone: z.string().optional(),
  referee_email: z.string().email({ message: 'Invalid email address' }).optional(),
  referee_type: z.enum(['seller', 'landlord'], { 
    required_error: 'Please select a referral type' 
  }),
  situation_description: z.string().optional(),
  additional_notes: z.string().optional(),
  contact_consent: z.boolean().default(false),
});

type PartnerReferralFormValues = z.infer<typeof partnerReferralFormSchema>;

interface PartnerReferralFormProps {
  onSubmitSuccess?: () => void;
}

export function PartnerReferralForm({ onSubmitSuccess }: PartnerReferralFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<PartnerReferralFormValues>({
    resolver: zodResolver(partnerReferralFormSchema),
    defaultValues: {
      referee_name: '',
      referee_phone: '',
      referee_email: '',
      referee_type: 'seller',
      situation_description: '',
      additional_notes: '',
      contact_consent: false,
    },
  });

  async function onSubmit(data: PartnerReferralFormValues) {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit referrals.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user.email) {
      toast({
        title: "Profile Error",
        description: "Your user profile is missing an email. Please contact support.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First, check if there's already a referrer with this email
      const { data: existingReferrerByEmail, error: emailFetchError } = await supabase
        .from('referrers')
        .select('id, user_id')
        .eq('email', user.email)
        .maybeSingle();
      
      if (emailFetchError) {
        throw emailFetchError;
      }
      
      // Then, check if the user has a referrer record by user_id
      const { data: existingReferrerByUserId, error: userIdFetchError } = await supabase
        .from('referrers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (userIdFetchError) {
        throw userIdFetchError;
      }
      
      let referrerId: string;
      
      // Case 1: Referrer exists with same email but different user_id - update the user_id
      if (existingReferrerByEmail && (!existingReferrerByEmail.user_id || existingReferrerByEmail.user_id !== user.id)) {
        const { error: updateError } = await supabase
          .from('referrers')
          .update({ user_id: user.id })
          .eq('id', existingReferrerByEmail.id);
          
        if (updateError) {
          console.error('Error updating referrer user_id:', updateError);
          throw new Error('Failed to update partner profile. Please contact support.');
        }
        
        referrerId = existingReferrerByEmail.id;
      }
      // Case 2: Referrer exists with user_id - use that
      else if (existingReferrerByUserId) {
        referrerId = existingReferrerByUserId.id;
      }
      // Case 3: Referrer exists with both matching email and user_id - use that
      else if (existingReferrerByEmail) {
        referrerId = existingReferrerByEmail.id;
      }
      // Case 4: No referrer exists - create one
      else {
        // Get user info from auth metadata
        const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      'Partner User';
        
        const { data: newReferrer, error: insertError } = await supabase
          .from('referrers')
          .insert({
            full_name: fullName,
            email: user.email,
            user_id: user.id,
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
      
      // Now create the referral with the verified referrer_id
      const referralRecord = {
        ...data,
        referrer_id: referrerId,
        status: 'New' // Default status for new referrals
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
        description: "Your referral has been successfully submitted!",
      });
      
      // Reset form
      form.reset({
        referee_name: '',
        referee_phone: '',
        referee_email: '',
        referee_type: 'seller',
        situation_description: '',
        additional_notes: '',
        contact_consent: false,
      });
      
      // Close dialog
      setOpen(false);
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting partner referral:', error);
      toast({
        title: "Submission failed",
        description: error.message || "There was a problem submitting your referral. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold"
        >
          <CircleDollarSign className="h-4 w-4 mr-1" />
          Refer Someone Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">New Partner Referral</DialogTitle>
          <DialogDescription>
            Submit a new client referral and get one step closer to earning great rewards! Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectValue placeholder="Select a type" />
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
                      placeholder="Describe their situation, needs, and timeline..." 
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
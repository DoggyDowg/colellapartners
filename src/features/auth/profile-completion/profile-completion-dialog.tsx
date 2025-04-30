import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import supabase from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// Generate arrays for days and months
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// Get days in month (accounting for leap years)
const getDaysInMonth = (monthVal: string) => {
  if (!monthVal) return 31; // Default to 31 days if no month selected
  
  // Always use 2024 (a leap year) to ensure February has 29 days
  const year = 2024;
  const monthIndex = parseInt(monthVal, 10) - 1; // Convert month value to zero-based index
  
  // Handle invalid month index (defensive programming)
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return 31; // Default to 31 days for invalid month
  }
  
  return new Date(year, monthIndex + 1, 0).getDate();
};

const formSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: 'Please enter your full name' }),
  birthdayMonth: z
    .string({
      required_error: "Please select a month",
    }),
  birthdayDay: z
    .string({
      required_error: "Please select a day",
    }),
  phoneNumber: z
    .string()
    .min(1, { message: 'Please enter your phone number' })
    .regex(/^(\+?61|0)[2-478](\s?\d{4}\s?\d{4}|\s?\d{8})$/, { 
      message: 'Please enter a valid Australian phone number (e.g., 0412 345 678)' 
    }),
})

interface ProfileCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ProfileCompletionDialog({ 
  open, 
  onOpenChange,
  onComplete 
}: ProfileCompletionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      birthdayMonth: '',
      birthdayDay: '',
    },
    mode: 'onChange',
  })
  
  // Fetch current user data to pre-fill the form
  useEffect(() => {
    if (!user) return;
    
    async function fetchUserProfile() {
      try {
        // Get any existing user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name, phone_number, birthday')
          .eq('id', user?.id ?? '')
          .single();
        
        // Pre-fill form with existing data if available
        if (profile) {
          // Handle birthday MM-DD format
          let birthdayMonth = '';
          let birthdayDay = '';
          
          if (profile.birthday && profile.birthday.includes('-')) {
            const parts = profile.birthday.split('-');
            if (parts.length === 2) {
              birthdayMonth = parts[0];
              birthdayDay = parts[1];
            }
          }
          
          // Update form with existing values
          form.reset({
            fullName: profile.name || '',
            phoneNumber: profile.phone_number || '',
            birthdayMonth,
            birthdayDay
          });
        } else if (user?.user_metadata) {
          // If no profile but user has metadata in auth
          const metadata = user.user_metadata;
          form.setValue('fullName', metadata.full_name || '');
          form.setValue('phoneNumber', metadata.phone || '');
        }
      } catch (_err) {
        // Replace console.error with setting a state that can be displayed to the user if needed
        setError('Could not load your profile data. You can still complete the form.');
      }
    }
    
    fetchUserProfile();
  }, [user, form]);
  
  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      setError('No user found. Please try logging in again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format birthday as MM-DD (month and day only)
      const formattedBirthday = `${data.birthdayMonth}-${data.birthdayDay}`;
      
      // First update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phoneNumber
        }
      });
      
      if (metadataError) {
        throw metadataError;
      }
      
      // Prepare profile data
      const profileData = {
        id: user.id,
        name: data.fullName,
        email: user.email,
        birthday: formattedBirthday,
        phone_number: data.phoneNumber,
        updated_at: new Date().toISOString()
      };
      
      // Update or create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'id'
        });
      
      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message || 'Unknown error'}`);
      }
      
      // Call the setup function to ensure everything is set up correctly
      try {
        await supabase.rpc('complete_user_setup');
      } catch (_setupError) {
        // Silently handle setup errors, since the basic profile is created
      }
      
      // Close the dialog
      onOpenChange(false);
      
      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating your profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }
  
  function handleDismiss() {
    // Simply close the dialog
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            It looks like your profile is incomplete. Taking a moment to fill this out helps us 
            provide a better experience and ensures you won't miss out on any rewards or benefits!
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-2">
            {error}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Full Name</FormLabel>
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
                name="birthdayMonth"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Birthday</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent 
                        position="popper" 
                        align="start" 
                        side="bottom" 
                        sideOffset={4}
                        className="max-h-[200px] overflow-y-auto"
                      >
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="birthdayDay"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>&nbsp;</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!form.watch("birthdayMonth")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent 
                        position="popper" 
                        align="start" 
                        side="bottom" 
                        sideOffset={4}
                        className="max-h-[200px] overflow-y-auto"
                      >
                        {form.watch("birthdayMonth") ? 
                          Array.from(
                            { length: getDaysInMonth(form.watch("birthdayMonth") || '') }, 
                            (_, i) => (i + 1).toString().padStart(2, '0')
                          ).map(day => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))
                          : 
                          <SelectItem disabled value="placeholder">
                            Select month first
                          </SelectItem>
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormDescription className="text-sm text-muted-foreground -mt-2">
              We might surprise you with a little reward on your birthday! 🎁
            </FormDescription>
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0412 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDismiss}
                className="w-full sm:w-auto"
              >
                Do it Later
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
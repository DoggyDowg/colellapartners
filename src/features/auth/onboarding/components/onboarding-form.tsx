import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
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

type OnboardingFormProps = HTMLAttributes<HTMLDivElement>

// Generate arrays for days and months
// const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
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

export function OnboardingForm({ className, ...props }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

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

  // Catch any errors in form setup
  useEffect(() => {
    try {
      // Intentionally empty - just to catch any initialization errors
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err);
      } else {
        setFormError(new Error('Unknown error occurred during form initialization'));
      }
    }
  }, []);

  // Check for user data and retry if needed
  useEffect(() => {
    if (!authLoading && !user && retryCount < maxRetries) {
      // If auth loading is complete but no user is found, retry after a delay
      const retryDelay = Math.pow(2, retryCount) * 500; // Exponential backoff
      
      const retryTimer = setTimeout(() => {
        // Retry to get user data
        setRetryCount(prev => prev + 1);
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [user, authLoading, retryCount]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      setError('No user found. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Format birthday as MM-DD (month and day only)
      // The column is actually character varying type, not DATE
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
      
      // Prepare profile data with proper column names
      const profileData = {
        id: user.id,
        name: data.fullName,
        email: user.email,
        birthday: formattedBirthday,
        phone_number: data.phoneNumber, // Use phone_number, not phone
        updated_at: new Date().toISOString()
      };
      
      // Then update or create user profile with retry mechanism
      let profileUpdateSuccessful = false;
      let profileRetryCount = 0;
      const profileMaxRetries = 2;
      let errorMessage = '';
      
      while (!profileUpdateSuccessful && profileRetryCount <= profileMaxRetries) {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .upsert(profileData, {
              onConflict: 'id'
            });
          
          if (error) {
            // Safely extract error message
            errorMessage = typeof error.message === 'string' ? error.message : 'Unknown database error';
            profileRetryCount++;
            
            if (profileRetryCount <= profileMaxRetries) {
              // Wait briefly before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 500 * profileRetryCount));
            }
          } else {
            profileUpdateSuccessful = true;
          }
        } catch (err) {
          // Safely extract error message from caught exception
          errorMessage = err instanceof Error ? err.message : 'Unknown error during profile update';
          profileRetryCount++;
          
          if (profileRetryCount <= profileMaxRetries) {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 500 * profileRetryCount));
          }
        }
      }
      
      if (!profileUpdateSuccessful) {
        throw new Error(`Profile update failed: ${errorMessage}`);
      }
      
      // Call the setup function to ensure everything is set up correctly
      try {
        await supabase.rpc('complete_user_setup');
      } catch (_setupError) {
        // Silently handle setup errors, since the basic profile is created
      }
      
      // Redirect to dashboard
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (isAdmin) {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating your profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      {formError ? (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive">
          <h3 className="font-medium mb-2">Something went wrong</h3>
          <p className="text-sm">We're having trouble loading the form. Please try refreshing the page.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      ) : authLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      ) : !user && retryCount >= maxRetries ? (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive">
          <h3 className="font-medium mb-2">Authentication Failed</h3>
          <p className="text-sm">We couldn't retrieve your profile. This could be due to a temporary issue.</p>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => navigate({ to: '/sign-in' })}
            >
              Sign In Again
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid gap-4'>
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-2">
                  {error}
                </div>
              )}
              
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name='birthdayMonth'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
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
                  name='birthdayDay'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
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
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder='0412 345 678' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className='mt-2' disabled={isLoading}>
                {isLoading ? 'Completing setup...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
} 
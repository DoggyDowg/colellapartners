import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { EyeIcon, EyeOffIcon, CheckCircle2, XCircle } from 'lucide-react'

// --- Password Requirements Constants ---
const MIN_LENGTH = 8;
const REGEX_UPPERCASE = /[A-Z]/;
const REGEX_LOWERCASE = /[a-z]/;
const REGEX_NUMBER = /[0-9]/;

// --- Schema --- 
const passwordFormSchema = z.object({
  newPassword: z
    .string()
    .min(MIN_LENGTH, { message: `Password must be at least ${MIN_LENGTH} characters long` })
    .regex(REGEX_UPPERCASE, { message: 'Password must contain at least one uppercase letter' })
    .regex(REGEX_LOWERCASE, { message: 'Password must contain at least one lowercase letter' })
    .regex(REGEX_NUMBER, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>

// --- Helper Component for Requirement Checklist Item ---
interface RequirementItemProps {
  isMet: boolean;
  text: string;
  isError?: boolean;
}

function RequirementItem({ isMet, text, isError = false }: RequirementItemProps) {
  const colorClass = isMet ? 'text-green-600' : (isError ? 'text-red-600' : 'text-muted-foreground');
  return (
    <div className={`flex items-center text-xs ${colorClass}`}>
      {isMet ? (
        <CheckCircle2 className="mr-2 h-3 w-3 flex-shrink-0" />
      ) : (
        <XCircle className="mr-2 h-3 w-3 flex-shrink-0" /> 
      )}
      {text}
    </div>
  );
}

// --- Main Password Form Component ---
export function PasswordForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // --- State for Password Requirements Checklist ---
  const [minLengthMet, setMinLengthMet] = useState(false);
  const [uppercaseMet, setUppercaseMet] = useState(false);
  const [lowercaseMet, setLowercaseMet] = useState(false);
  const [numberMet, setNumberMet] = useState(false);
  
  // --- Form Setup ---
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })
  
  // --- Watch password fields for real-time comparison ---
  const newPasswordValue = form.watch('newPassword');
  const confirmPasswordValue = form.watch('confirmPassword');

  // --- Effect to check complexity requirements --- 
  useEffect(() => {
    setMinLengthMet(newPasswordValue.length >= MIN_LENGTH);
    setUppercaseMet(REGEX_UPPERCASE.test(newPasswordValue));
    setLowercaseMet(REGEX_LOWERCASE.test(newPasswordValue));
    setNumberMet(REGEX_NUMBER.test(newPasswordValue));
  }, [newPasswordValue]);

  // --- Handle Form Submission ---
  async function onSubmit(data: PasswordFormValues) {
    if (!user?.id) {
      toast({ title: 'Authentication required', description: 'You must be logged in', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) {
        toast({ title: 'Failed to update password', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Password updated', description: 'Your password has been changed' });
        form.reset();
      }
    } catch (_error) {
      toast({ title: 'An unexpected error occurred', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // Determine if passwords match based on current form values and lack of specific error
  const doPasswordsMatch = newPasswordValue === confirmPasswordValue && confirmPasswordValue.length > 0;
  const showMatchIndicator = doPasswordsMatch && !form.formState.errors.confirmPassword;
  // Check if the specific error is the "don't match" error
  const showMismatchError = form.formState.errors.confirmPassword?.message === "Passwords don't match";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='relative'>
          <h3 className='mb-4 text-lg font-medium'>Change Password</h3>
          <div className='space-y-4'>
            {/* --- New Password Field --- */}
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="Enter new password" 
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                  {/* --- Password Requirements Checklist --- */}
                  {(newPasswordValue.length > 0 || form.formState.dirtyFields.newPassword) && (
                    <div className="mt-2 space-y-1">
                      <RequirementItem isMet={minLengthMet} text={`At least ${MIN_LENGTH} characters`} />
                      <RequirementItem isMet={uppercaseMet} text="Uppercase letter (A-Z)" />
                      <RequirementItem isMet={lowercaseMet} text="Lowercase letter (a-z)" />
                      <RequirementItem isMet={numberMet} text="Number (0-9)" />
                    </div>
                  )}
                  {/* Shows other potential errors for newPassword like min length etc. */}
                  {form.formState.errors.newPassword && <FormMessage />}
                </FormItem>
              )}
            />
            
            {/* --- Confirm Password Field --- */}
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  {/* Apply error class manually if mismatch error exists */}
                  <FormLabel className={showMismatchError ? 'text-destructive' : ''}>
                    Confirm Password
                  </FormLabel>
                  <div className="relative">
                    {/* Apply error class manually if mismatch error exists */}
                    <FormControl>
                      <Input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm new password" 
                        {...field} 
                        className={showMismatchError ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                    </FormControl>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                  {/* --- Password Match Indicator (Green Check) --- */}
                  {showMatchIndicator && (
                    <div className="mt-2 space-y-1">
                      <RequirementItem 
                        isMet={true} 
                        text={"Passwords match"} 
                      />
                    </div>
                  )}
                  {/* --- Password Mismatch Message (Red Text/Icon) --- */}
                  {/* Show the specific mismatch error message if it exists */}
                  {showMismatchError && (
                     <div className="mt-2 space-y-1">
                       <RequirementItem 
                         isMet={false} 
                         text={"Passwords do not match"} 
                         isError={true} // Ensure red color
                       />
                     </div>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type='submit' className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </Form>
  )
} 
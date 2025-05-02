// This component is very similar to the PasswordForm in settings,
// but it's used on a public page after clicking a password reset link.
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
import { EyeIcon, EyeOffIcon, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router' // For redirecting after success

// --- Password Requirements Constants ---
const MIN_LENGTH = 8;
const REGEX_UPPERCASE = /[A-Z]/;
const REGEX_LOWERCASE = /[a-z]/;
const REGEX_NUMBER = /[0-9]/;

// --- Schema (same as settings password form) ---
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

// --- Helper Component for Requirement Checklist Item (copied from settings) ---
interface RequirementItemProps {
  isMet: boolean;
  text: string;
  isError?: boolean;
}

function RequirementItem({ isMet, text, isError = false }: RequirementItemProps) {
  const colorClass = isMet ? 'text-green-600' : (isError ? 'text-red-600' : 'text-muted-foreground');
  return (
    <div className={`flex items-center text-xs ${colorClass}`}>
      {isMet ? <CheckCircle2 className="mr-2 h-3 w-3 flex-shrink-0" /> : <XCircle className="mr-2 h-3 w-3 flex-shrink-0" />}
      {text}
    </div>
  );
}

// --- Update Password Form Component ---
export function UpdatePasswordForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for Password Requirements Checklist
  const [minLengthMet, setMinLengthMet] = useState(false);
  const [uppercaseMet, setUppercaseMet] = useState(false);
  const [lowercaseMet, setLowercaseMet] = useState(false);
  const [numberMet, setNumberMet] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const newPasswordValue = form.watch('newPassword');
  const confirmPasswordValue = form.watch('confirmPassword');

  // Effect to check complexity requirements
  useEffect(() => {
    setMinLengthMet(newPasswordValue.length >= MIN_LENGTH);
    setUppercaseMet(REGEX_UPPERCASE.test(newPasswordValue));
    setLowercaseMet(REGEX_LOWERCASE.test(newPasswordValue));
    setNumberMet(REGEX_NUMBER.test(newPasswordValue));
  }, [newPasswordValue]);

  // Handle form submission
  async function onSubmit(data: PasswordFormValues) {
    setLoading(true);
    try {
      // Call Supabase auth updateUser - assumes temporary session is active
      const { error } = await supabase.auth.updateUser({ 
        password: data.newPassword 
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Password Updated Successfully',
        description: 'Your password has been changed. Please log in.',
      });
      form.reset();
      // Redirect to login page after successful update
      navigate({ to: '/auth/login', replace: true });

    } catch (error: unknown) {
      // Define default message
      let errorMessage = 'An error occurred. Please try again or request a new link.';
      // Check if it's a standard Error object
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // You could add more specific checks for Supabase errors if needed
      // else if (error && typeof error === 'object' && 'message' in error) {
      //   errorMessage = String(error.message);
      // }

      toast({
        title: 'Failed to Update Password',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  
  // --- Determine match/mismatch for UI feedback ---
  const doPasswordsMatch = newPasswordValue === confirmPasswordValue && confirmPasswordValue.length > 0;
  const showMatchIndicator = doPasswordsMatch && !form.formState.errors.confirmPassword;
  const showMismatchError = form.formState.errors.confirmPassword?.message === "Passwords don't match";

  return (
    <Form {...form}>
      {/* Use space-y-4 for slightly less vertical space than settings form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'> 
        {/* --- New Password Field --- */}
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" {...field} />
                </FormControl>
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              {/* Requirements Checklist */}
              {(newPasswordValue.length > 0 || form.formState.dirtyFields.newPassword) && (
                <div className="mt-2 space-y-1">
                  <RequirementItem isMet={minLengthMet} text={`At least ${MIN_LENGTH} characters`} />
                  <RequirementItem isMet={uppercaseMet} text="Uppercase letter (A-Z)" />
                  <RequirementItem isMet={lowercaseMet} text="Lowercase letter (a-z)" />
                  <RequirementItem isMet={numberMet} text="Number (0-9)" />
                </div>
              )}
              {/* Shows other potential errors like min length etc. */}
              {form.formState.errors.newPassword && <FormMessage className="text-xs"/>}
            </FormItem>
          )}
        />
        
        {/* --- Confirm Password Field --- */}
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel className={showMismatchError ? 'text-destructive' : ''}>Confirm New Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm new password" 
                    {...field} 
                    className={showMismatchError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                </FormControl>
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              {/* Match Indicator */}
              {showMatchIndicator && (
                <div className="mt-2 space-y-1">
                  <RequirementItem isMet={true} text={"Passwords match"} />
                </div>
              )}
              {/* Mismatch Message */}
              {showMismatchError && (
                  <div className="mt-2 space-y-1">
                    <RequirementItem isMet={false} text={"Passwords do not match"} isError={true}/>
                  </div>
              )}
            </FormItem>
          )}
        />
        
        <Button type='submit' className="w-full mt-4" disabled={loading}>
          {loading ? 'Updating Password...' : 'Set New Password'}
        </Button>
      </form>
    </Form>
  )
} 
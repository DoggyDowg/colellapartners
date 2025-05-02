import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { FcGoogle } from 'react-icons/fc'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Checkbox } from "@/components/ui/checkbox"
import supabase from '@/lib/supabase'
import { CheckCircle2, XCircle } from 'lucide-react'

type SignUpFormProps = HTMLAttributes<HTMLDivElement>

// --- Password Requirements Constants (consistent with settings) ---
const MIN_LENGTH = 8;
const REGEX_UPPERCASE = /[A-Z]/;
const REGEX_LOWERCASE = /[a-z]/;
const REGEX_NUMBER = /[0-9]/;
const REQUIREMENTS_TEXT = "Min 8 chars, upper, lower, number";

const formSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Please enter your email' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(1, { message: 'Please enter your password' })
      // Add complexity checks
      .min(MIN_LENGTH, { message: `Password must be at least ${MIN_LENGTH} characters long` })
      .regex(REGEX_UPPERCASE, { message: 'Password must contain at least one uppercase letter' })
      .regex(REGEX_LOWERCASE, { message: 'Password must contain at least one lowercase letter' })
      .regex(REGEX_NUMBER, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }), // Ensure confirm is not empty
    communication_emails: z.boolean().optional().default(false),
    marketing_emails: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // --- State for concise complexity feedback ---
  const [complexityMet, setComplexityMet] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      communication_emails: true,
      marketing_emails: true,
    },
    mode: 'onChange', // Validate on change
  })
  
  // --- Watch password field ---
  const passwordValue = form.watch('password');

  // --- Effect to check complexity --- 
  useEffect(() => {
    const isLengthMet = passwordValue.length >= MIN_LENGTH;
    const isUpperMet = REGEX_UPPERCASE.test(passwordValue);
    const isLowerMet = REGEX_LOWERCASE.test(passwordValue);
    const isNumberMet = REGEX_NUMBER.test(passwordValue);
    setComplexityMet(isLengthMet && isUpperMet && isLowerMet && isNumberMet);
  }, [passwordValue]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Get admin domains from environment variable
      const adminDomains = import.meta.env.VITE_ADMIN_EMAIL_DOMAINS?.split(',') || []
      
      // Check if email domain matches any admin domain
      const emailDomain = data.email.split('@')[1]?.toLowerCase()
      const isAdmin = emailDomain ? adminDomains.includes(emailDomain) : false
      
      // Sign up with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Note: We cannot reliably pass email preferences here
          // as this data is stored in user_metadata, not user_profiles table
          // We will insert into user_profiles AFTER successful sign up
          data: {
            is_admin: isAdmin
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }
      
      // If signup was successful and user object exists, create profile
      if (signUpData.user) {
        // Immediately sign in the new user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        
        if (signInError) {
          // Log sign-in error but proceed to profile creation attempt
          console.error("Sign in after sign up failed:", signInError);
        }
        
        // Create a profile record with the email preferences
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              email: data.email, // Email is required
              name: data.email.split('@')[0] || 'New User', // Use part of email as default name
              communication_emails: data.communication_emails ?? false,
              marketing_emails: data.marketing_emails ?? false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            // Log error but continue navigation, onboarding will handle missing profile
            // console.error("Error creating initial profile:", profileError);
          }
        } catch (profileCreationError) {
          // console.error("Exception creating initial profile:", profileCreationError);
        }
        
        // Redirect to the onboarding page regardless of profile creation success
        navigate({ to: '/onboarding' })
      } else if (signUpData.session === null && signUpData.user === null) {
        // Handle cases where email confirmation is required
        setSuccess('Registration successful! Please check your email to confirm your account.')
        form.reset() // Clear form
      } else {
        // Handle unexpected scenarios
        setError("An unexpected issue occurred during sign up. Please try again.")
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during registration';
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/`,
        },
      })

      if (error) throw error
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during Google sign up';
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-2">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400 mb-2">
                {success}
              </div>
            )}
            
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='name@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grid container for password fields */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(passwordValue.length > 0 || form.formState.dirtyFields.password) && (
              <FormDescription className={`flex items-center text-xs mt-1 ${complexityMet ? 'text-green-600' : 'text-muted-foreground'}`}>
                {complexityMet ? (
                   <CheckCircle2 className="mr-1.5 h-3 w-3 flex-shrink-0" />
                ) : (
                   <XCircle className="mr-1.5 h-3 w-3 flex-shrink-0" />
                )}
                {REQUIREMENTS_TEXT}
              </FormDescription>
            )}

            {form.formState.errors.password && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}

            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="communication_emails"
                    />
                  </FormControl>
                  <FormLabel htmlFor="communication_emails" className="text-xs font-normal text-muted-foreground">
                    Ok to send referral & account emails.
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="marketing_emails"
                    />
                  </FormControl>
                  <FormLabel htmlFor="marketing_emails" className="text-xs font-normal text-muted-foreground">
                    Ok to send market updates & offers from Colella Property.
                  </FormLabel>
                </FormItem>
              )}
            />

            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Continue'}
            </Button>

            <div className="relative my-2"> 
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with Google
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
              type='button'
              disabled={isLoading}
              onClick={handleGoogleSignUp}
            >
              <FcGoogle className='h-5 w-5' />
              <span>Continue with Google</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

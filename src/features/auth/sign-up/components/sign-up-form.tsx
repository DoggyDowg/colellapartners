import { HTMLAttributes, useState } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import supabase from '@/lib/supabase'

type SignUpFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z
  .object({
    fullName: z
      .string()
      .min(1, { message: 'Please enter your full name' }),
    email: z
      .string()
      .min(1, { message: 'Please enter your email' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(1, {
        message: 'Please enter your password',
      })
      .min(7, {
        message: 'Password must be at least 7 characters long',
      }),
    confirmPassword: z.string(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

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
      
      // First, sign up without using the trigger
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.fullName,
            is_admin: isAdmin
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }
      
      // If signup was successful, immediately sign in
      if (signUpData.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        
        if (signInError) {
          throw signInError
        }
        
        // Now call the setup function
        try {
          await supabase.rpc('complete_user_setup')
          
          // We don't throw if setup fails - we still created the account
          // Just silently continue
        } catch (_setupErr) {
          // Don't throw, just silently continue
        }
        
        // Redirect based on user role
        if (isAdmin) {
          // Redirect admin users to admin dashboard
          navigate({ to: '/admin' })
        } else {
          // Redirect regular users to partner dashboard
          navigate({ to: '/' })
        }
      } else {
        // Show success message if the user needs to confirm email
        setSuccess('Registration successful! You can now log in with your credentials.')
        
        // Clear form
        form.reset()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
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
                    <FormMessage />
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

            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

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

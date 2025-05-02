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
import { ForgotPasswordDialog } from '../../forgot-password/components/forgot-password-dialog'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
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
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      // Sign in with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) throw signInError
      
      // Check if the user is an admin
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin')
      
      if (adminCheckError) {
        // If we can't determine admin status, redirect to the regular dashboard
        navigate({ to: '/' })
        return
      }
      
      // Redirect based on user role
      if (isAdmin) {
        // Redirect admin users to admin dashboard
        navigate({ to: '/admin' })
      } else {
        // Redirect regular users to partner dashboard
        navigate({ to: '/' })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during Google sign in';
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
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Password</FormLabel>
                    <button
                      type="button"
                      onClick={() => setIsForgotDialogOpen(true)}
                      className='text-xs font-light text-muted-foreground hover:opacity-75'
                    >
                      Forgot password?
                    </button>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>

            <div className='relative my-2'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or continue with Google
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
              type='button'
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              <FcGoogle className='h-5 w-5' />
              <span>Continue with Google</span>
            </Button>
          </div>
        </form>
      </Form>
      
      <ForgotPasswordDialog 
        open={isForgotDialogOpen} 
        onOpenChange={setIsForgotDialogOpen} 
      />
    </div>
  )
}

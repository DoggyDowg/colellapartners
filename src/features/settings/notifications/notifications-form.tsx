import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const notificationsFormSchema = z.object({
  communication_emails: z.boolean().default(true),
  marketing_emails: z.boolean().default(true),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export function NotificationsForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [commEmail, setCommEmail] = useState(true)
  const [marketingEmail, setMarketingEmail] = useState(true)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
  // Form with default values
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      communication_emails: true,
      marketing_emails: true,
    },
  })

  // Load existing preferences from database when component mounts
  useEffect(() => {
    async function loadUserPreferences() {
      if (!user?.id) return
      
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('communication_emails, marketing_emails')
          .eq('id', user.id)
          .single()
        
        if (error) {
          // Silent error - don't show to user, just use defaults
          // This helps when the profile doesn't exist yet
          return
        }
        
        if (data) {
          // Set form values from database
          const commValue = data.communication_emails ?? true
          const marketingValue = data.marketing_emails ?? true
          
          form.setValue('communication_emails', commValue)
          form.setValue('marketing_emails', marketingValue)
          
          // Update local state to match
          setCommEmail(commValue)
          setMarketingEmail(marketingValue)
          
          setInitialDataLoaded(true)
        }
      } catch (_err) {
        // Silent error handling - use defaults
        // Don't show error to user for initial data load
      } finally {
        setLoading(false)
      }
    }
    
    loadUserPreferences()
  }, [user, form])

  // Handle form submission
  async function onSubmit(data: NotificationsFormValues) {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to update notification preferences',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          communication_emails: data.communication_emails,
          marketing_emails: data.marketing_emails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        toast({
          title: 'Failed to update preferences',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Preferences updated',
          description: 'Your notification preferences have been saved',
        })
      }
    } catch (_error) {
      toast({
        title: 'An unexpected error occurred',
        description: 'Please try again later',
        variant: 'destructive',
      })
    }
    
    // Always set loading back to false
    setLoading(false)
  }

  const toggleCommEmails = async () => {
    setCommEmail(!commEmail)
    form.setValue('communication_emails', !commEmail)
  }

  const toggleMarketingEmails = async () => {
    setMarketingEmail(!marketingEmail)
    form.setValue('marketing_emails', !marketingEmail)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='relative'>
          <h3 className='mb-4 text-lg font-medium'>Email Notifications</h3>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='communication_emails'
              render={() => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Communication emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about your account activity and referrals.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={commEmail}
                      onCheckedChange={toggleCommEmails}
                      disabled={loading && !initialDataLoaded}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='marketing_emails'
              render={() => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Marketing emails
                    </FormLabel>
                    <FormDescription>
                      Receive market updates, property insights, and special offers from Colella Property.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={marketingEmail}
                      onCheckedChange={toggleMarketingEmails}
                      disabled={loading && !initialDataLoaded}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type='submit' className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Saving...' : 'Update notifications'}
        </Button>
      </form>
    </Form>
  )
}

import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { Checkbox } from '../../../components/ui/checkbox'
import { DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Card, CardContent } from '../../../components/ui/card'
import { Check } from 'lucide-react'
import supabase from '../../../lib/supabase'
import { useAuth } from '../../../hooks/useAuth'

type ToolkitPartnerSetupFormProps = HTMLAttributes<HTMLDivElement> & {
  onComplete: () => void
  onCancel: () => void
}

const partnerSetupSchema = z.object({
  is_business: z.boolean().default(false),
  business_name: z.string().optional(),
  business_address: z.string().optional(),
  contact_person_name: z.string().optional(),
  contact_person_phone: z.string().optional(),
  use_my_details: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // If business mode is enabled, make business fields required
  if (data.is_business) {
    if (!data.business_name || data.business_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Business name is required',
        path: ['business_name'],
      })
    }
    if (!data.business_address || data.business_address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,  
        message: 'Business address is required',
        path: ['business_address'],
      })
    }
    if (!data.contact_person_name || data.contact_person_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact person name is required',
        path: ['contact_person_name'],
      })
    }
    if (!data.contact_person_phone || data.contact_person_phone.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact person phone is required',
        path: ['contact_person_phone'],
      })
    }
  }
})

export function ToolkitPartnerSetupForm({ className, onComplete, onCancel, ...props }: ToolkitPartnerSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<'yes' | 'no' | null>(null)
  const { user } = useAuth()

  const form = useForm<z.infer<typeof partnerSetupSchema>>({
    resolver: zodResolver(partnerSetupSchema),
    defaultValues: {
      is_business: false,
      business_name: '',
      business_address: '',
      contact_person_name: '',
      contact_person_phone: '',
      use_my_details: false,
    },
    mode: 'onChange',
  })

  // Watch the use_my_details checkbox
  const useMyDetails = form.watch('use_my_details')

  // Update form when business type changes
  useEffect(() => {
    if (businessType === 'yes') {
      form.setValue('is_business', true)
    } else if (businessType === 'no') {
      form.setValue('is_business', false)
    }
  }, [businessType, form])

  // Auto-fill contact person fields when "I am the main contact" is checked
  useEffect(() => {
    if (useMyDetails && user) {
      // Get user's name and phone from user_metadata or user_profiles
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      let userPhone = user.user_metadata?.phone || ''
      
      // If no phone in metadata, try to get from user profile table
      if (!userPhone) {
        supabase
          .from('user_profiles')
          .select('phone_number')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.phone_number) {
              form.setValue('contact_person_phone', data.phone_number)
            }
          })
      }
      
      form.setValue('contact_person_name', userName)
      form.setValue('contact_person_phone', userPhone)
    } else if (!useMyDetails) {
      // Clear fields when unchecked
      form.setValue('contact_person_name', '')
      form.setValue('contact_person_phone', '')
    }
  }, [useMyDetails, user, form])

  async function onSubmit(data: z.infer<typeof partnerSetupSchema>) {
    if (!user) {
      setError('No user found. Please try logging in again.')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Get user's phone from profile if not in metadata
      let userPhone = user.user_metadata?.phone || ''
      if (!userPhone) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('phone_number')
          .eq('id', user.id)
          .single()
        userPhone = profile?.phone_number || ''
      }

      // Prepare referrer data
      const referrerData = {
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        phone: data.is_business ? (data.contact_person_phone || '') : userPhone,
        is_business: data.is_business,
        business_name: data.is_business ? data.business_name : null,
        contact_person: data.is_business ? data.contact_person_name : null,
        address: data.is_business ? data.business_address : null,
        user_id: user.id,
        active: true,
        created_at: new Date().toISOString(),
      }

      // Insert into referrers table
      const { error: insertError } = await supabase
        .from('referrers')
        .insert(referrerData)

      if (insertError) {
        throw insertError
      }

      // Success - close form and redirect
      onComplete()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while setting up your partner account'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set Up Partner Account</DialogTitle>
      </DialogHeader>
      
      <div className={cn('grid gap-4 pt-4', className)} {...props}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Business Type Selection */}
            <div className="space-y-3">
              <FormLabel className="text-base font-medium">
                Are you a business?
              </FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={businessType === 'yes' ? 'default' : 'outline'}
                  onClick={() => setBusinessType('yes')}
                  className="flex-1"
                >
                  {businessType === 'yes' && <Check className="w-4 h-4 mr-2" />}
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={businessType === 'no' ? 'default' : 'outline'}
                  onClick={() => setBusinessType('no')}
                  className="flex-1"
                >
                  {businessType === 'no' && <Check className="w-4 h-4 mr-2" />}
                  No
                </Button>
              </div>
            </div>

            {/* Business Fields - shown when Yes is selected */}
            {businessType === 'yes' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h3 className="font-medium text-base">Business Information</h3>
                
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="use_my_details"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I am the main contact
                        </FormLabel>
                        <div className="text-xs text-muted-foreground">
                          This will automatically fill in your name and phone number
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact Person Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="0412 345 678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* No Business Message - shown when No is selected */}
            {businessType === 'no' && (
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <Check className="w-8 h-8 mx-auto text-green-600" />
                    <p className="font-medium">Perfect! No additional information required.</p>
                    <p className="text-sm text-muted-foreground">
                      You're all set to proceed with your partner account setup.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || businessType === null}
                className="flex-1"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
} 
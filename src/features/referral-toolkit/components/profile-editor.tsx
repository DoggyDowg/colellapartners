import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../../hooks/useAuth'
import { ProfileEditorProps } from '../types'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Switch } from '../../../components/ui/switch'
import { Checkbox } from '../../../components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../../../components/ui/form'
import { Loader2, Save, User, Building } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '../../../lib/supabase'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  is_business: z.boolean(),
  business_name: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
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
    if (!data.contact_person || data.contact_person.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact person name is required',
        path: ['contact_person'],
      })
    }
    if (!data.address || data.address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Business address is required',
        path: ['address'],
      })
    }
  }
})

export function ProfileEditor({ partnerData, onUpdate }: ProfileEditorProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      is_business: false,
      business_name: '',
      contact_person: '',
      address: '',
      bio: '',
      website: '',
      use_my_details: false,
    },
    mode: 'onChange',
  })

  // Watch form changes to enable/disable save button
  const watchedValues = form.watch()
  const isBusiness = form.watch('is_business')
  const useMyDetails = form.watch('use_my_details')

  // Initialize form with partner data
  useEffect(() => {
    if (partnerData) {
      form.reset({
        full_name: partnerData.full_name || '',
        email: partnerData.email || '',
        phone: partnerData.phone || '',
        is_business: partnerData.is_business || false,
        business_name: partnerData.business_name || '',
        contact_person: partnerData.contact_person || '',
        address: partnerData.address || '',
        bio: partnerData.bio || '',
        website: partnerData.website || '',
        use_my_details: false,
      })
    }
  }, [partnerData])

  // Auto-fill contact person fields when "I am the main contact" is checked
  useEffect(() => {
    if (useMyDetails && isBusiness) {
      const currentName = form.getValues('full_name')
      const currentPhone = form.getValues('phone')
      
      form.setValue('contact_person', currentName)
      // Don't override phone if contact person phone is different
      if (!form.getValues('contact_person')) {
        form.setValue('phone', currentPhone)
      }
    } else if (!useMyDetails && isBusiness) {
      // Clear contact person when unchecked
      form.setValue('contact_person', '')
    }
  }, [useMyDetails, isBusiness])

  // Check for changes
  useEffect(() => {
    if (!partnerData) return

    const currentValues = form.getValues()
    const hasFormChanges = 
      currentValues.full_name !== (partnerData.full_name || '') ||
      currentValues.email !== (partnerData.email || '') ||
      currentValues.phone !== (partnerData.phone || '') ||
      currentValues.is_business !== (partnerData.is_business || false) ||
      currentValues.business_name !== (partnerData.business_name || '') ||
      currentValues.contact_person !== (partnerData.contact_person || '') ||
      currentValues.address !== (partnerData.address || '') ||
      currentValues.bio !== (partnerData.bio || '') ||
      currentValues.website !== (partnerData.website || '')

    setHasChanges(hasFormChanges)
  }, [watchedValues, partnerData])

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user?.id || !partnerData) {
      toast.error('Unable to save changes. Please try refreshing the page.')
      return
    }

    setSaving(true)
    try {
      // Prepare update data
      const updateData = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || undefined,
        is_business: data.is_business,
        business_name: data.is_business ? data.business_name : undefined,
        contact_person: data.is_business ? data.contact_person : undefined,
        address: data.is_business ? data.address : undefined,
        bio: data.bio || undefined,
        website: data.website || undefined,
        updated_at: new Date().toISOString(),
      }

      // Update referrer record
      const { error } = await supabase
        .from('referrers')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // Call parent update handler
      await onUpdate(updateData)
      setHasChanges(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    if (partnerData) {
      form.reset({
        full_name: partnerData.full_name || '',
        email: partnerData.email || '',
        phone: partnerData.phone || '',
        is_business: partnerData.is_business || false,
        business_name: partnerData.business_name || '',
        contact_person: partnerData.contact_person || '',
        address: partnerData.address || '',
        bio: partnerData.bio || '',
        website: partnerData.website || '',
        use_my_details: false,
      })
      setHasChanges(false)
    }
  }

  if (!partnerData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading profile data...</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0412 345 678" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - used for contact purposes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself or your business..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional - appears on marketing materials
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://yourwebsite.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional - include https://
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Business Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_business"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">
                      Business Partner
                    </FormLabel>
                    <FormDescription>
                      Toggle this if you're representing a business
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isBusiness && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main St, City, State, Postcode"
                          className="min-h-[80px]"
                          {...field} 
                        />
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
                        <FormDescription className="text-xs">
                          This will use your name as the contact person
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={saving || !hasChanges}
          >
            Reset Changes
          </Button>
          
          <Button
            type="submit"
            disabled={saving || !hasChanges}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <div className="text-sm text-muted-foreground text-center">
            You have unsaved changes
          </div>
        )}
      </form>
    </Form>
  )
} 
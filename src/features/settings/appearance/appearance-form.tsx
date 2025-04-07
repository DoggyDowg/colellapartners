import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTheme } from '@/context/theme-context'
import { toast } from '@/hooks/use-toast'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    required_error: 'Please select a theme.',
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const { theme: globalTheme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  // Initialize form with current theme from context
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: (globalTheme || 'system') as 'light' | 'dark' | 'system',
    },
  })

  // Load saved theme preference from database - only run once
  useEffect(() => {
    async function loadThemePreference() {
      if (!initialLoad) return;
      
      try {
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setInitialLoad(false);
          return;
        }
        
        setUserId(user.id)
        
        // Fetch user's profile with theme preference
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('theme')
          .eq('id', user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
          console.error('Error fetching theme preference:', error)
          setInitialLoad(false);
          return;
        }
        
        // If we have a saved theme preference, use it to initialize the form
        // but DON'T auto-change the theme unless it's initial load
        if (profile && profile.theme) {
          const savedTheme = profile.theme as 'light' | 'dark' | 'system'
          form.reset({ theme: savedTheme })
          
          // We keep the user's current theme experience unless they explicitly submit
          // the form to change it
        }
        
        setInitialLoad(false);
      } catch (error) {
        console.error('Error loading theme preference:', error)
        setInitialLoad(false);
      }
    }
    
    loadThemePreference()
  }, [form, initialLoad]);

  // Handle form submission
  async function onSubmit(data: AppearanceFormValues) {
    if (!userId) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to update your preferences.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setLoading(true)
      
      // Update the theme context first for immediate feedback
      setTheme(data.theme)
      
      // Fetch existing profile data to ensure we don't lose required fields
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError)
        throw fetchError
      }

      // Prepare the update data with required fields
      const updateData = {
        id: userId,
        name: existingProfile?.name || '',
        email: existingProfile?.email || '',
        theme: data.theme,
        updated_at: new Date().toISOString(),
      }
      
      console.log('Updating profile with data:', updateData)
      
      // Save the theme preference to the database
      const { error } = await supabase
        .from('user_profiles')
        .upsert(updateData, { onConflict: 'id' })
        
      if (error) {
        console.error('Upsert error:', error)
        throw error
      }
      
      toast({
        title: 'Appearance preferences updated',
        description: 'Your appearance settings have been saved.',
      })
    } catch (error) {
      console.error('Error updating theme preference:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to save appearance preferences.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle theme change directly on radio selection
  const handleThemeChange = (value: string) => {
    const themeValue = value as 'light' | 'dark' | 'system';
    form.setValue('theme', themeValue);
    
    // Apply theme change immediately for better UX
    setTheme(themeValue);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='theme'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard. Changes take effect immediately.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={handleThemeChange}
                value={field.value}
                className='grid max-w-md grid-cols-3 gap-8 pt-2'
              >
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='light' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted p-1 hover:border-accent'>
                      <div className='space-y-2 rounded-sm bg-[#ecedef] p-2'>
                        <div className='space-y-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-2 w-[80px] rounded-lg bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>
                      Light
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='dark' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground'>
                      <div className='space-y-2 rounded-sm bg-slate-950 p-2'>
                        <div className='space-y-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-2 w-[80px] rounded-lg bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>
                      Dark
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='system' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted p-1 hover:border-accent'>
                      <div className='space-y-2 rounded-sm bg-gradient-to-br from-[#ecedef] to-slate-900 p-2'>
                        <div className='space-y-2 rounded-md bg-gradient-to-r from-white to-slate-800 p-2 shadow-sm'>
                          <div className='h-2 w-[80px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-gradient-to-r from-[#ecedef] to-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-slate-800 p-2 shadow-sm'>
                          <div className='h-4 w-4 rounded-full bg-gradient-to-r from-[#ecedef] to-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>
                      System
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
              <FormDescription className="mt-2">
                System mode will automatically match your device's theme preference. 
                <br />
                <span className="text-muted-foreground mt-1 block">
                  Click "Update appearance" to save this preference for all your sessions.
                </span>
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type='submit' disabled={loading} className="w-full md:w-auto">
          {loading ? 'Updating...' : 'Update appearance'}
        </Button>
      </form>
    </Form>
  )
}

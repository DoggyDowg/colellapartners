import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import supabase from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from '@/hooks/use-toast';

// Schema for email validation
const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const handleResetRequest = async (data: EmailFormValues) => {
    setIsLoading(true);
    setIsSuccess(false);
    
    // **IMPORTANT:** Define the URL where users will be redirected AFTER clicking the email link.
    // This page needs to handle the actual password update using supabase.auth.updateUser().
    // Make sure this route exists in your app and is added to Supabase Redirect URLs.
    const resetRedirectUrl = `${window.location.origin}/update-password`; 

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: resetRedirectUrl,
      });

      if (error) {
        throw error;
      }
      
      // Show success message
      setIsSuccess(true);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions.' });
      form.reset(); // Clear the form
      // Optionally close dialog after a delay or keep it open with success message
      // setTimeout(() => onOpenChange(false), 3000); 

    } catch (error: any) {
      toast({
        title: 'Error Sending Reset Email',
        description: error.message || 'Could not send reset instructions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset success state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsSuccess(false); 
      form.reset(); // Clear form on close
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            Enter your email address below and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md text-center">
            <p>Password reset email sent successfully!</p>
            <p className="text-sm mt-1">Please check your inbox (and spam folder).</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleResetRequest)} className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        
      </DialogContent>
    </Dialog>
  );
} 
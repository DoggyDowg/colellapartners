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
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ZoomInIcon,
  ZoomOutIcon,
  MoveIcon,
  Trash2,
  Camera,
} from 'lucide-react'

const profileFormSchema = z.object({
  name: z
    .string()
    .max(50, {
      message: 'Name must not be longer than 50 characters.',
    })
    .optional()
    .or(z.literal('')),
  email: z
    .string({
    })
    .email({ message: 'Please enter a valid email format if provided.'})
    .optional()
    .or(z.literal('')),
  birthday_month: z.string().optional(),
  birthday_day: z.string().optional(),
  avatar_url: z.string().optional(),
  phone_number: z
    .string()
    .optional()
    .or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Default values if user data is not available yet
const defaultValues: Partial<ProfileFormValues> = {
  name: '',
  email: '',
  phone_number: '',
}

// Maximum file size allowed (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Array of all months
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Get days in month (accounting for leap years)
const getDaysInMonth = (month: number) => {
  // Always use 2024 (a leap year) to ensure February has 29 days
  const year = 2024;
  // Ensure valid month index (0-11)
  const safeMonth = Math.max(0, Math.min(11, month));
  return new Date(year, safeMonth + 1, 0).getDate();
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [dbDiagnostics, setDbDiagnostics] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // State to directly control birthday UI
  const [birthdayMonth, setBirthdayMonth] = useState<string | undefined>(undefined)
  const [birthdayDay, setBirthdayDay] = useState<string | undefined>(undefined)
  
  // Image editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(0.1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })
  
  // Use a ref to store form methods to avoid dependency issues
  const formRef = useRef(form)
  formRef.current = form
  
  // Fetch the current user and profile data
  useEffect(() => {
    let isMounted = true;
    
    async function getUserData() {
      try {
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: 'Authentication error',
            description: 'You must be logged in to view your profile.',
            variant: 'destructive',
          })
          return
        }
        
        setUserId(user.id)
        
        // Test direct query without any table existence check
        try {
          const { data: _profile, error: directError } = await supabase
            .from('user_profiles')
            .select('id, name, email')
            .eq('id', user.id)
            .maybeSingle()
          
          if (directError) {
            setDbDiagnostics(`Direct query error: ${directError.message}. Code: ${directError.code}`)
            
            // Continue with insert attempt anyway
          }
        } catch (_directErr) {
          // Remove console.error statement
        }
        
        // Just try to insert first if table exists
        try {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              name: user.user_metadata?.name || 'New User',
              email: user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id', ignoreDuplicates: true })
          
          if (insertError) {
            setDbDiagnostics(`Error inserting profile: ${insertError.message}. Code: ${insertError.code}`)
          }
        } catch (_insertErr) {
          // Remove console.error statement
        }
        
        // Now try to get the profile with a different approach
        try {
          const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (fetchError) {
            setDbDiagnostics(`Error fetching profile: ${fetchError.message}. Code: ${fetchError.code}.
            
This usually indicates a permissions issue with Row Level Security (RLS).
Check if the RLS policies are correctly set up on the user_profiles table.`)
            
            // Still try to display with user info only
            formRef.current.reset({
              ...defaultValues,
              name: user.user_metadata?.name || '',
              email: user.email || '',
            })
            return
          }
          
          // If profile exists, use it
          if (profile) {
            // Format date from string to Date object if it exists
            let birthday_month = undefined;
            let birthday_day = undefined;
            
            if (profile.birthday) {
              try {
                const birthdayDate = new Date(profile.birthday);
                // Get month name from the months array
                birthday_month = months[birthdayDate.getMonth()];
                // Get day as string
                birthday_day = String(birthdayDate.getDate());
              } catch (_error) {
                // Unable to parse date, will use undefined values
                setDbDiagnostics(`Failed to parse birthday date from database: ${profile.birthday}`);
              }
            }
            
            // Set our state variables
            setBirthdayMonth(birthday_month);
            setBirthdayDay(birthday_day);
            
            formRef.current.reset({
              name: profile.name || user.user_metadata?.name || '',
              email: profile.email || user.email || '',
              birthday_month,
              birthday_day,
              avatar_url: profile.avatar_url || '',
              phone_number: profile.phone_number || '',
            });
          } else {
            // No profile found
            formRef.current.reset({
              ...defaultValues,
              name: user.user_metadata?.name || '',
              email: user.email || '',
            });
          }
        } catch (_fetchErr) {
          setDbDiagnostics(`Exception fetching profile: ${String(_fetchErr)}`)
        }
      } catch (_error) {
        if (isMounted) {
          setDbDiagnostics(`General error: ${String(_error)}`)
          toast({
            title: 'Error',
            description: 'Failed to load profile data.',
            variant: 'destructive',
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    getUserData()
    
    // Cleanup function to handle component unmounting during async operations
    return () => {
      isMounted = false;
    };
  }, []) // Only run on mount

  // Function to optimize the image
  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Determine dimensions for the canvas
          let width = img.width;
          let height = img.height;
          
          // We'll scale down large images to reduce size
          const maxDimension = 1200; // Max width or height
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality adjustment
          const quality = 0.85; // Start with good quality
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // If conversion fails, return the original file
              resolve(file);
            }
          }, file.type, quality);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Load image into editor
  const loadImageIntoEditor = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        variant: 'destructive',
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      
      // Create image object to get dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        
        // Calculate initial zoom to fit image within crop area
        // Assuming crop area is 200x200 (based on the UI)
        const cropSize = 200;
        const widthRatio = cropSize / img.width;
        const heightRatio = cropSize / img.height;
        const fitZoom = Math.min(widthRatio, heightRatio);
        
        // Set minimum zoom to ensure image can always fit crop area
        setMinZoom(fitZoom * 0.9); // 90% of perfect fit to ensure complete visibility
        
        // Set initial zoom to fit the image properly
        setZoom(fitZoom);
        
        // Reset position
        setPosition({ x: 0, y: 0 });
        
        // Open dialog AFTER setting all state
        setTimeout(() => {
          setImageEditorOpen(true);
          // Force a canvas update after a slight delay to ensure DOM is ready
          setTimeout(() => updateCanvas(), 50);
        }, 0);
      };
      img.src = imgSrc;
    };
    reader.readAsDataURL(file);
  };

  // Update canvas with current crop, zoom, and position
  const updateCanvas = useCallback(() => {
    if (!canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match displayed size to prevent stretching
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate center position
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Apply transformations while preserving aspect ratio
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(position.x, position.y);
    
    // Calculate position to center the image
    const drawX = -originalImage.width / 2;
    const drawY = -originalImage.height / 2;
    
    // Draw the image centered
    ctx.drawImage(originalImage, drawX, drawY, originalImage.width, originalImage.height);
    ctx.restore();
  }, [canvasRef, originalImage, zoom, position]);

  // Apply the cropped image
  const applyCrop = async () => {
    if (!canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a square crop canvas
    const cropCanvas = document.createElement('canvas');
    const cropSize = 500; // Higher resolution for better quality
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (!cropCtx) return;
    
    // Calculate the position and size of the crop area in the original canvas
    const displaySize = 200; // Size of crop circle in UI
    
    // Find the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Save current canvas state for reference
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx?.drawImage(canvas, 0, 0);
    
    // Draw the image on crop canvas centered and scaled correctly
    cropCtx.save();
    cropCtx.fillStyle = 'white';
    cropCtx.fillRect(0, 0, cropSize, cropSize);
    
    // Extract just the circular area from the editor
    cropCtx.drawImage(
      tempCanvas,
      centerX - displaySize/2, 
      centerY - displaySize/2,
      displaySize,
      displaySize,
      0,
      0,
      cropSize,
      cropSize
    );
    
    // Create circular mask
    cropCtx.globalCompositeOperation = 'destination-in';
    cropCtx.beginPath();
    cropCtx.arc(cropSize/2, cropSize/2, cropSize/2, 0, Math.PI * 2);
    cropCtx.closePath();
    cropCtx.fill();
    cropCtx.restore();
    
    // Convert to blob
    cropCanvas.toBlob(async (blob) => {
      if (blob) {
        // Convert blob to file
        const croppedFile = new File([blob], "profile-pic.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        
        // Optimize the image
        const optimizedBlob = await optimizeImage(croppedFile);
        const optimizedFile = new File(
          [optimizedBlob], 
          "profile-pic.jpg", 
          { type: "image/jpeg", lastModified: Date.now() }
        );
        
        // Set the avatar file and update the form
        setAvatarFile(optimizedFile);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(optimizedFile);
        formRef.current.setValue('avatar_url', previewUrl);
        
        // Close editor
        setImageEditorOpen(false);
      }
    }, 'image/jpeg', 0.9);
  };

  // Dialog open/close handler with canvas initialization
  const handleDialogOpenChange = (open: boolean) => {
    setImageEditorOpen(open);
    // If opening, ensure canvas is updated after DOM is ready
    if (open && originalImage) {
      setTimeout(() => updateCanvas(), 50);
    }
  };

  // Component resize observer to handle window resizing
  useEffect(() => {
    if (!imageContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvas();
    });
    
    resizeObserver.observe(imageContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCanvas]);

  // Update canvas when relevant state changes
  useEffect(() => {
    if (imageEditorOpen && originalImage) {
      // Use RAF to ensure smooth updates
      requestAnimationFrame(updateCanvas);
    }
  }, [imageEditorOpen, originalImage, updateCanvas]);

  // Mouse and touch event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    
    setPosition({
      x: position.x + dx,
      y: position.y + dy
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle avatar upload
  const uploadAvatar = async (file: File) => {
    if (!userId) return null
    
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`
    
    try {
      // Try to upload the file directly to the profiles bucket
      const { error: uploadError, data: _uploadData } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })
        
      if (uploadError) {
        throw uploadError
      }
      
      const { data: urlData } = await supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)
      
      return urlData.publicUrl
    } catch (_error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
      return null
    }
  }

  // Handle profile picture deletion
  const deleteProfilePicture = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      
      // First, try to delete the file from storage
      try {
        // Get the current profile to find the avatar URL
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single()
        
        if (profile?.avatar_url) {
          // From the uploadAvatar function, we know files are stored as:
          // ${userId}/avatar.${fileExt}
          // But we need to extract the file extension from the URL
          
          try {
            // Try to extract file extension from URL
            const url = new URL(profile.avatar_url)
            const pathSegments = url.pathname.split('/')
            const filename = pathSegments[pathSegments.length - 1]
            const fileExt = filename.split('.').pop() || 'jpg'
            
            // Construct the storage path using the same pattern as in uploadAvatar
            const filePath = `${userId}/avatar.${fileExt}`
            
            // Call our custom RPC function to delete the file
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'delete_storage_object',
              {
                bucket_name: 'profiles',
                object_path: filePath
              }
            )
            
            // If our RPC function didn't work, try the standard method
            if (rpcError || rpcResult === false) {
              // Try standard delete method
              const { error: deleteError, data: deleteData } = await supabase.storage
                .from('profiles')
                .remove([filePath])
              
              // If standard method didn't work, try listing files in the folder
              if (!deleteError && (!deleteData || deleteData.length === 0)) {
                // List all files in the user's folder to get exact paths
                const { data: folderData, error: folderError } = await supabase.storage
                  .from('profiles')
                  .list(userId)
                
                if (!folderError && folderData && folderData.length > 0) {
                  // Try to delete each file found
                  for (const file of folderData) {
                    if (file.name.includes('avatar') || file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
                      const exactPath = `${userId}/${file.name}`
                      
                      // Try RPC delete first for this file
                      const { data: fileRpcResult } = await supabase.rpc(
                        'delete_storage_object',
                        {
                          bucket_name: 'profiles',
                          object_path: exactPath
                        }
                      )
                      
                      if (fileRpcResult === true) {
                        // Successfully deleted
                      } else {
                        // Fall back to standard method
                        const { error: _exactDeleteError } = await supabase.storage
                          .from('profiles')
                          .remove([exactPath])
                        
                        // Handle the result silently
                      }
                    }
                  }
                }
              }
              
              // Final attempt: Try with different extensions
              const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
              
              for (const ext of extensions) {
                if (ext === fileExt) continue // Skip the one we already tried
                
                const altFilePath = `${userId}/avatar.${ext}`
                
                // Try RPC delete first
                const { error: _rpcAltError, data: _rpcAltResult } = await supabase.rpc(
                  'delete_storage_object',
                  {
                    bucket_name: 'profiles',
                    object_path: altFilePath
                  }
                )
                
                // Also try standard method
                const { error: _altError } = await supabase.storage
                  .from('profiles')
                  .remove([altFilePath])
              }
            }
          } catch (_pathErr) {
            // Continue with operation
          }
        }
      } catch (_storageErr) {
        // Continue to update the database anyway
      }
      
      // Now update the user profile to remove the avatar_url regardless of storage deletion success
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      
      if (updateError) {
        throw updateError
      }
      
      // Reset the form
      formRef.current.setValue('avatar_url', '')
      
      // Success message
      toast({
        title: 'Profile picture deleted',
        description: 'Your profile picture has been removed.',
      })
      
    } catch (_error) {
      toast({
        title: 'Deletion failed',
        description: 'Failed to delete profile picture. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    if (!userId) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setLoading(true)
      
      // If there's a new avatar file, upload it
      let avatarUrl = data.avatar_url
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }
      
      // Prepare data for upsert
      const profileData: Record<string, unknown> = {
        id: userId,
        name: data.name,
        email: data.email,
        updated_at: new Date().toISOString(),
      }
      
      // Only add these if they exist - use our state variables directly to be safe
      if (birthdayMonth && birthdayDay) {
        const monthIndex = months.findIndex(m => m === birthdayMonth);
        if (monthIndex !== -1) {
          // Format month with leading zero if needed
          const month = String(monthIndex + 1).padStart(2, '0');
          const day = String(birthdayDay).padStart(2, '0');
          // Store as MM-DD format (character varying type in database)
          profileData.birthday = `${month}-${day}`;
        }
      }
      
      if (avatarUrl) {
        profileData.avatar_url = avatarUrl
      }
      
      if (data.phone_number) {
        profileData.phone_number = data.phone_number
      }
      
      // Upsert the profile data
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' })
        
      if (error) {
        throw error
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (_error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {dbDiagnostics && (
          <div className="p-4 mb-4 border border-red-300 bg-red-50 text-red-800 rounded">
            <p className="font-medium">Database Diagnostic Info:</p>
            <p className="text-sm">{dbDiagnostics}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start space-y-4">
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <div className="flex items-start gap-4">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 cursor-pointer">
                        <AvatarImage src={field.value} alt="Profile Picture" />
                        <AvatarFallback>
                          {form.getValues().name?.charAt(0).toUpperCase() || form.getValues().email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Overlay on hover */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => document.getElementById('profile-pic-input')?.click()}
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      
                      {field.value && (
                        <Button 
                          variant="destructive" 
                          size="icon"
                          type="button"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      id="profile-pic-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          loadImageIntoEditor(file);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Click on your profile picture to upload a new image. JPG, PNG or GIF. 10MB max.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormDescription>
                Your full name as you'd like it to appear in the system.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
                <FormControl>
                <Input placeholder='name@example.com' {...field} />
                </FormControl>
              <FormDescription>
                This is your email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col">
          <div className="mb-2">
            <FormLabel>Birthday</FormLabel>
          </div>
          <div className="flex space-x-2">
            {/* Hard-coded select with direct DOM manipulation for month */}
            <div className="relative w-[180px]">
              <select 
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={birthdayMonth || ""}
                onChange={(e) => {
                  // Set the month value
                  const value = e.target.value;
                  setBirthdayMonth(value);
                  formRef.current.setValue('birthday_month', value);
                  
                  // Clear the day
                  setBirthdayDay(undefined);
                  formRef.current.setValue('birthday_day', undefined);
                  
                  // Enable the day dropdown
                  const daySelect = document.getElementById('birthday-day-select') as HTMLSelectElement;
                  if (daySelect) {
                    daySelect.disabled = false;
                  }
                }}
              >
                <option value="" disabled>Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Hard-coded select for day */}
            <div className="relative w-[100px]">
              <select 
                id="birthday-day-select"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={birthdayDay || ""}
                disabled={!birthdayMonth}
                onChange={(e) => {
                  const value = e.target.value;
                  setBirthdayDay(value);
                  formRef.current.setValue('birthday_day', value);
                }}
              >
                <option value="" disabled>Day</option>
                {birthdayMonth && Array.from(
                  { length: getDaysInMonth(months.indexOf(birthdayMonth)) }, 
                  (_, i) => (i + 1).toString()
                ).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FormDescription className="mt-2">
            Your birthday for sending you a special reward. We only need the month and day.
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+61 400 000 000" {...field} />
              </FormControl>
              <FormDescription>
                Your mobile phone number in Australian format (e.g., +61412345678 or 0412345678).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type='submit' 
          disabled={loading} 
          className="w-full md:w-auto"
        >
          {loading ? 'Updating...' : 'Update profile'}
        </Button>
        
        {/* Profile Picture Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Profile Picture?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your profile picture will be permanently deleted
                from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteProfilePicture}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Image Editor Dialog */}
        <Dialog open={imageEditorOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Profile Picture</DialogTitle>
              <DialogDescription>
                Adjust position and zoom to create your profile picture
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 py-4">
              {/* Canvas Container */}
              <div 
                ref={imageContainerRef}
                className="relative w-full h-[300px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas 
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="absolute inset-0 w-full h-full"
                />
                
                {/* Circular mask overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[200px] h-[200px]">
                    <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                    <div className="absolute -inset-[500px] bg-black bg-opacity-30 [mask-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><circle cx=%22100%22 cy=%22100%22 r=%22100%22 fill=%22black%22/></svg>'); mask-size:200px 200px; mask-position:center; mask-repeat:no-repeat; mask-mode:alpha]"></div>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ZoomOutIcon className="h-4 w-4" />
                  <Slider
                    value={[zoom]}
                    min={minZoom}
                    max={3}
                    step={0.02}
                    onValueChange={(value: number[]) => setZoom(value[0])}
                    className="flex-grow"
                  />
                  <ZoomInIcon className="h-4 w-4" />
                </div>
                
                <div className="flex justify-between">
                  <div className="flex gap-1 items-center text-sm text-muted-foreground">
                    <MoveIcon className="h-3 w-3" /> Drag to position image
                  </div>
                </div>
              </div>
        </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageEditorOpen(false)}>Cancel</Button>
              <Button onClick={applyCrop}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  )
}

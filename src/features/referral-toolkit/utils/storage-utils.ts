import supabase from '../../../lib/supabase'

const BUCKET_NAME = 'partner-logos'

export interface UploadResult {
  url: string
  path: string
  size: number
}

export interface UploadError extends Error {
  code?: string
  statusCode?: number
}

/**
 * Upload a logo file to Supabase Storage
 */
export async function uploadLogo(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validate file
    validateLogoFile(file)
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${userId}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const filePath = `${userId}/${fileName}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (error) {
      throw createUploadError(error.message, error)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      size: file.size
    }
  } catch (error) {
    console.error('Logo upload error:', error)
    throw error instanceof Error ? error : new Error('Upload failed')
  }
}

/**
 * Delete a logo file from Supabase Storage
 */
export async function deleteLogo(logoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const filePath = extractFilePathFromUrl(logoUrl)
    
    if (!filePath) {
      throw new Error('Invalid logo URL')
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Logo deletion error:', error)
      // Don't throw on deletion errors as the file might already be gone
    }
  } catch (error) {
    console.error('Logo deletion error:', error)
    // Don't throw on deletion errors to prevent blocking other operations
  }
}

/**
 * Validate logo file before upload
 */
function validateLogoFile(file: File): void {
  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    throw createUploadError(
      'Invalid file type. Please upload PNG, JPG, or SVG files only.',
      { code: 'INVALID_FILE_TYPE' }
    )
  }

  // Check file size (6MB limit)
  const maxSize = 6 * 1024 * 1024 // 6MB in bytes
  if (file.size > maxSize) {
    throw createUploadError(
      'File too large. Please upload files smaller than 6MB.',
      { code: 'FILE_TOO_LARGE' }
    )
  }

  // Basic validation complete - dimension checking could be added here if needed
}

/**
 * Create a standardized upload error
 */
function createUploadError(message: string, details?: any): UploadError {
  const error = new Error(message) as UploadError
  if (details?.code) error.code = details.code
  if (details?.statusCode) error.statusCode = details.statusCode
  return error
}

/**
 * Extract file path from Supabase Storage URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase storage URLs follow the pattern:
    // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{userId}/{filename}
    const urlParts = url.split('/storage/v1/object/public/')
    if (urlParts.length !== 2) return null
    
    const pathPart = urlParts[1]
    const bucketAndPath = pathPart.split('/')
    
    if (bucketAndPath[0] !== BUCKET_NAME) return null
    
    // Return the userId/filename part
    return bucketAndPath.slice(1).join('/')
  } catch {
    return null
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedLogoUrl(logoUrl: string, _options?: {
  width?: number
  height?: number
  quality?: number
}): string {
  // For now, return the original URL
  // In the future, you could add Supabase image transformations here
  // or use a service like Cloudinary
  return logoUrl
}

/**
 * Check if storage bucket exists and is accessible
 */
export async function checkStorageAccess(): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 })
    
    return !error
  } catch {
    return false
  }
}

/**
 * Instructions for manual bucket creation
 */
export const BUCKET_SETUP_INSTRUCTIONS = `
To complete the logo upload functionality, create the storage bucket manually:

1. Go to Supabase Dashboard > Storage
2. Create new bucket with these settings:
   - Name: partner-logos
   - Public: true (for reading logos)
   - File size limit: 6MB
   - Allowed file types: image/png, image/jpeg, image/svg+xml

3. Create RLS policies:
   - SELECT (read): Allow public access
   - INSERT/UPDATE: Allow authenticated users to upload to their own folder
   - DELETE: Allow authenticated users to delete their own files

The bucket path structure will be: {userId}/{userId}-{timestamp}-{filename}
` 
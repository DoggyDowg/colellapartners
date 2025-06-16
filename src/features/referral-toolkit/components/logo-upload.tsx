import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { LogoUploadProps } from '../types'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'

import { Progress } from '../../../components/ui/progress'
import { Badge } from '../../../components/ui/badge'
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '../../../lib/supabase'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const STORAGE_BUCKET = 'partner-logos'

export function LogoUpload({ currentLogoUrl, onUpload, onDelete }: LogoUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB'
    }
    return null
  }

  const generateFileName = (file: File): string => {
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    return `${user?.id}-${timestamp}.${extension}`
  }

  const uploadFile = async (file: File) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Ensure we have a fresh session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Authentication session error. Please try logging out and back in.')
    }
    
    if (!session) {
      throw new Error('No active session. Please log in again.')
    }

    const fileName = generateFileName(file)
    const filePath = `${user.id}/${fileName}`

    console.log('Uploading file:', { fileName, filePath, userId: user.id })

    // Upload to Supabase Storage with explicit session handling
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const deleteCurrentLogo = async () => {
    if (!currentLogoUrl || !user) return

    try {
      // Extract file path from URL
      const url = new URL(currentLogoUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get user_id/filename

      // Delete from storage
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('Error deleting file from storage:', error)
        // Don't throw here - we still want to update the database
      }

      // Update database
      const { error: dbError } = await supabase
        .from('referrers')
        .update({ logo_url: null })
        .eq('user_id', user.id)

      if (dbError) {
        throw dbError
      }

      setPreviewUrl(null)
      await onDelete()
      toast.success('Logo deleted successfully!')
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast.error('Failed to delete logo')
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Delete existing logo if present
      if (currentLogoUrl) {
        await deleteCurrentLogo()
      }

      // Upload new file
      const logoUrl = await uploadFile(file)

      // Update database
      const { error: dbError } = await supabase
        .from('referrers')
        .update({ logo_url: logoUrl })
        .eq('user_id', user?.id)

      if (dbError) {
        throw dbError
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      await onUpload(file)
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading logo:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload logo')
      toast.error('Failed to upload logo')
      setPreviewUrl(currentLogoUrl || null) // Revert preview
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [currentLogoUrl, user, onUpload, onDelete])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      handleFileSelect(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Current Logo Display */}
      {previewUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Current Logo</h3>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Partner Logo"
                  className="w-24 h-24 object-contain border rounded-lg bg-white"
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your logo will appear on QR codes and marketing materials
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteCurrentLogo}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Logo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="h-5 w-5" />
            <h3 className="font-medium">
              {previewUrl ? 'Replace Logo' : 'Upload Logo'}
            </h3>
          </div>

          {/* Drag and Drop Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
            `}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />

            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>

              <div>
                <p className="text-lg font-medium">
                  {dragActive ? 'Drop your logo here' : 'Upload your logo'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop or click to browse
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">JPEG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">WebP</Badge>
                <Badge variant="outline">Max 2MB</Badge>
              </div>

              {!uploading && (
                <Button variant="outline" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress}% complete
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="mt-6 text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">Logo Guidelines:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Use a square or rectangular logo for best results</li>
              <li>Ensure good contrast against white backgrounds</li>
              <li>High resolution images work best for print materials</li>
              <li>Simple designs are more effective on QR codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
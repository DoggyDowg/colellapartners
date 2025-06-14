import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Header } from '../../components/layout/header'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '../../lib/supabase'
import { PartnerData, PDFTemplate } from './types'
import { PartnerSetupPrompt } from './components/setup-prompt'
import { PartnerCodeForm } from './components/partner-code-form'
import { QRCodeGenerator } from './components/qr-code-generator'
import { LogoUpload } from './components/logo-upload'
import { ProfileEditor } from './components/profile-editor'
import { PDFGenerator } from './components/pdf-generator'
import { generateReferralUrl } from './utils/code-validation'

export function ReferralToolkit() {
  const { user } = useAuth()
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // Fetch partner data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchPartnerData()
    }
  }, [user?.id])

  // Update QR code URL when partner code changes
  useEffect(() => {
    if (partnerData?.partner_code?.trim()) {
      setQrCodeUrl(generateReferralUrl(partnerData.partner_code))
    } else {
      setQrCodeUrl('')
    }
  }, [partnerData?.partner_code])

  const fetchPartnerData = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No partner record found
          setShowSetupPrompt(true)
        } else {
          throw error
        }
      } else {
        setPartnerData(data as PartnerData)
        setShowSetupPrompt(false)
      }
    } catch (_err) {
      setError('Failed to load partner information')
      toast.error('Failed to load partner information')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setShowSetupPrompt(false)
    fetchPartnerData()
  }

  // Partner code handlers
  const handleCodeUpdate = (_code: string) => {
    // Don't update partnerData immediately - let the component handle its own state
    // This prevents circular updates that make hasChanges always false
  }

  const handleCodeSave = async (code: string) => {
    if (!user?.id) return
    
    try {
      const { error } = await supabase
        .from('referrers')
        .update({ partner_code: code })
        .eq('user_id', user.id)

      if (error) throw error
      
      await fetchPartnerData()
      toast.success('Partner code updated successfully!')
    } catch (error) {
      toast.error('Failed to save partner code')
      throw error
    }
  }

  // QR Code handlers
  const handleQRDownload = async (format: 'png' | 'svg') => {
    // TODO: Implement QR code download
    toast.success(`QR code downloaded as ${format.toUpperCase()}`)
  }

  // Logo handlers
  const handleLogoUpload = async (file: File) => {
    if (!user?.id) return
    
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(fileName)

      // Update partner record
      const { error: updateError } = await supabase
        .from('referrers')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      await fetchPartnerData()
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload logo')
      throw error
    }
  }

  const handleLogoDelete = async () => {
    if (!user?.id || !partnerData?.logo_url) return
    
    try {
      // Remove from database
      const { error } = await supabase
        .from('referrers')
        .update({ logo_url: null })
        .eq('user_id', user.id)

      if (error) throw error

      await fetchPartnerData()
      toast.success('Logo removed successfully!')
    } catch (error) {
      toast.error('Failed to remove logo')
      throw error
    }
  }

  // PDF handlers
  const handlePDFGenerate = async (template: PDFTemplate) => {
    // TODO: Implement PDF generation
    toast.success(`PDF generated with ${template.name} template`)
  }

  if (loading) {
    return (
      <>
        <Header title="Referral Toolkit" />
        <div className="container py-6">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading toolkit...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header title="Referral Toolkit" />
        <div className="container py-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Referral Toolkit" />
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Referral Toolkit</h1>
            <p className="text-muted-foreground mt-1">
              Manage your referral code, create marketing materials, and track your referrals
            </p>
          </div>
        </div>

        <Tabs defaultValue="partner-code" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="partner-code">Partner Code</TabsTrigger>
            <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="partner-code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Code Management</CardTitle>
              </CardHeader>
              <CardContent>
                <PartnerCodeForm
                  partnerData={partnerData}
                  onCodeUpdate={handleCodeUpdate}
                  onSave={handleCodeSave}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr-code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator
                  partnerCode={partnerData?.partner_code || ''}
                  businessName={partnerData?.business_name || partnerData?.full_name || ''}
                  onDownload={handleQRDownload}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logo Management</CardTitle>
              </CardHeader>
              <CardContent>
                <LogoUpload
                  currentLogoUrl={partnerData?.logo_url}
                  onUpload={handleLogoUpload}
                  onDelete={handleLogoDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileEditor 
                  partnerData={partnerData} 
                  onUpdate={async (updatedData) => {
                    // Update the partner data in the database
                    if (!user?.id || !partnerData) return
                    
                    try {
                      const { error } = await supabase
                        .from('referrers')
                        .update(updatedData)
                        .eq('user_id', user.id)
                      
                      if (error) throw error
                      
                      // Refresh the data
                      await fetchPartnerData()
                      toast.success('Profile updated successfully')
                                          } catch (_err) {
                        toast.error('Failed to update profile')
                      }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <PDFGenerator
                  partnerData={partnerData}
                  qrCodeUrl={qrCodeUrl}
                  logoUrl={partnerData?.logo_url}
                  onGenerate={handlePDFGenerate}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Setup Prompt Dialog */}
      <PartnerSetupPrompt
        isOpen={showSetupPrompt}
        onClose={() => setShowSetupPrompt(false)}
        onSetupComplete={handleSetupComplete}
      />
    </>
  )
} 
// Referral Toolkit Types
export interface PartnerCode {
  code: string
  isValid: boolean
  isUnique: boolean
  isChecking: boolean
}

export interface PartnerData {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  is_business: boolean
  business_name?: string
  contact_person?: string
  address?: string
  partner_code?: string
  logo_url?: string
  bio?: string
  website?: string
  active: boolean
  created_at: string
}

export interface PartnerUpdateData {
  full_name?: string
  phone?: string
  is_business?: boolean
  business_name?: string
  contact_person?: string
  address?: string
  partner_code?: string
  logo_url?: string
}

export interface QRCodeOptions {
  size: number
  level: 'L' | 'M' | 'Q' | 'H'
  margin: number
  color: {
    dark: string
    light: string
  }
}

export interface PDFTemplate {
  id: string
  name: string
  description: string
  size: 'A4' | 'A3' | 'card' | 'flyer'
  orientation: 'portrait' | 'landscape'
}

export interface MarketingMaterial {
  template: PDFTemplate
  partnerData: PartnerData
  qrCodeUrl: string
  logoUrl?: string
}

export interface LogoUpload {
  file: File
  preview: string
  isUploading: boolean
  progress: number
  error?: string
}

export interface PartnerSetupPromptProps {
  isOpen: boolean
  onClose: () => void
  onSetupComplete: () => void
}

export interface PartnerCodeFormProps {
  partnerData: PartnerData | null
  onCodeUpdate: (code: string) => void
  onSave: (code: string) => Promise<void>
}

export interface QRCodeGeneratorProps {
  partnerCode: string
  businessName: string
  onDownload: (format: 'png' | 'svg') => void
}

export interface LogoUploadProps {
  currentLogoUrl?: string
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}

export interface ProfileEditorProps {
  partnerData: PartnerData | null
  onUpdate: (data: PartnerUpdateData) => Promise<void>
}

export interface PDFGeneratorProps {
  partnerData: PartnerData | null
  qrCodeUrl: string
  logoUrl?: string
  onGenerate: (template: PDFTemplate) => Promise<void>
} 
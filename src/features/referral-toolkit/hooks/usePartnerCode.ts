import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { PartnerCode } from '../types'
import { 
  validatePartnerCode, 
  sanitizeCodeInput, 
  generateReferralUrl 
} from '../utils/code-validation'
import supabase from '../../../lib/supabase'
import { toast } from 'sonner'

interface UsePartnerCodeProps {
  initialCode?: string
  onCodeChange?: (code: string) => void
  onSaveComplete?: (code: string) => void
}

interface UsePartnerCodeReturn {
  code: string
  partnerCode: PartnerCode
  referralUrl: string
  hasChanges: boolean
  saving: boolean
  wasSaved: boolean
  isEditing: boolean
  validationMessage: string | null
  handleCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSave: () => Promise<void>
  copyToClipboard: (text: string) => Promise<void>
  openUrl: () => void
  setIsEditing: (editing: boolean) => void
}

export const usePartnerCode = ({ 
  initialCode = '', 
  onCodeChange,
  onSaveComplete
}: UsePartnerCodeProps = {}): UsePartnerCodeReturn => {
  const { user } = useAuth()
  const [code, setCode] = useState(initialCode || '')
  const [currentInitialCode, setCurrentInitialCode] = useState(initialCode || '')
  

  const [partnerCode, setPartnerCode] = useState<PartnerCode>({
    code: '',
    isValid: false,
    isUnique: false,
    isChecking: false
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [wasSaved, setWasSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Initialize with existing partner code
  useEffect(() => {
    if (initialCode !== currentInitialCode) {
      setCode(initialCode || '')
      setCurrentInitialCode(initialCode || '')
      if (initialCode) {
        setPartnerCode({
          code: initialCode || '',
          isValid: true,
          isUnique: true,
          isChecking: false
        })
        setWasSaved(true) // Code exists in database, so it's saved
      } else {
        setWasSaved(false) // No code in database, so nothing is saved
      }
      setHasChanges(false)
    }
  }, [initialCode, currentInitialCode])

  // Debounced validation effect
  useEffect(() => {
    const validateCode = async () => {
      const trimmedCode = (code || '').trim().toUpperCase()
      
      if (!trimmedCode) {
        setPartnerCode({
          code: '',
          isValid: false,
          isUnique: false,
          isChecking: false
        })
        const initialCodeNormalized = (currentInitialCode || '').trim().toUpperCase()
        setHasChanges('' !== initialCodeNormalized)
        return
      }

      setPartnerCode(prev => ({ ...prev, isChecking: true }))

      try {
        const validation = await validatePartnerCode(trimmedCode, currentInitialCode)
        
        setPartnerCode({
          code: trimmedCode,
          isValid: validation.isValid,
          isUnique: validation.isUnique,
          isChecking: false
        })

        const initialCodeNormalized = (currentInitialCode || '').trim().toUpperCase()
        setHasChanges(trimmedCode !== initialCodeNormalized)
        
        // Reset saved state when code changes
        if (trimmedCode !== initialCodeNormalized) {
          setWasSaved(false)
        }
      } catch (error) {
        console.error('Error validating partner code:', error)
        setPartnerCode({
          code: trimmedCode,
          isValid: false,
          isUnique: false,
          isChecking: false
        })
      }
    }

    const timeoutId = setTimeout(validateCode, 500) // 500ms debounce
    return () => clearTimeout(timeoutId)
  }, [code, currentInitialCode])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeCodeInput(e.target.value)
    setCode(sanitizedValue)
    setWasSaved(false) // Reset saved state when user types
    setIsEditing(true) // Mark as editing when user types
    onCodeChange?.(sanitizedValue)
  }, [onCodeChange])

  const handleSave = useCallback(async () => {
    if (!partnerCode.isValid || !user?.id || !hasChanges) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('referrers')
        .update({ partner_code: partnerCode.code })
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setHasChanges(false)
      setWasSaved(true)
      setIsEditing(false)
      setCurrentInitialCode(partnerCode.code)
      toast.success('Partner code updated successfully!')
      onSaveComplete?.(partnerCode.code)
    } catch (error) {
      console.error('Error saving partner code:', error)
      toast.error('Failed to save partner code. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [partnerCode.isValid, partnerCode.code, user?.id, hasChanges, onSaveComplete])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  const openUrl = useCallback(() => {
    if (partnerCode.code) {
      window.open(generateReferralUrl(partnerCode.code), '_blank')
    }
  }, [partnerCode.code])

  const getValidationMessage = useCallback((): string | null => {
    // Only show validation messages when actively editing
    if (!isEditing) return null
    
    if (!(code || '').trim()) return null
    
    if (partnerCode.isChecking) {
      return 'Checking availability...'
    }

    // Use the validation utility to get consistent messages
    const trimmedCode = (code || '').trim().toUpperCase()
    const currentCodeNormalized = (currentInitialCode || '').trim().toUpperCase()
    
    if (!/^[A-Z0-9]{3,6}$/.test(trimmedCode)) {
      return 'Code must be 3-6 characters, letters and numbers only'
    }

    if (['ADMIN', 'API', 'WWW', 'MAIL', 'FTP', 'ROOT', 'USER', 'TEST', 'DEMO', 'NULL', 'VOID',
         'SPAM', 'FAKE', 'TEMP', 'DELETE', 'BANNED', 'ERROR', 'SYSTEM', 'SUPPORT', 'HELP',
         'COLELLA', 'PARTNER', 'REFER', 'CODE', 'QR', 'LINK', 'URL', 'CONTACT', 'INFO', 'ABOUT']
         .includes(trimmedCode)) {
      return 'This code is reserved and cannot be used'
    }

    // Check if this is the user's current code
    if (trimmedCode === currentCodeNormalized && currentCodeNormalized) {
      return 'This is your current code'
    }

    if (!partnerCode.isUnique) {
      return 'This code is already taken'
    }

    if (partnerCode.isValid) {
      return 'Code is available!'
    }

    return null
  }, [code, partnerCode, isEditing, currentInitialCode])

  const referralUrl = generateReferralUrl(partnerCode.code)
  const validationMessage = getValidationMessage()

  return {
    code,
    partnerCode,
    referralUrl,
    hasChanges,
    saving,
    wasSaved,
    isEditing,
    validationMessage,
    handleCodeChange,
    handleSave,
    copyToClipboard,
    openUrl,
    setIsEditing
  }
} 
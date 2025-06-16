import { PartnerCodeFormProps } from '../types'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Loader2, Check, X, Copy, ExternalLink } from 'lucide-react'
import { usePartnerCode } from '../hooks/usePartnerCode'

export function PartnerCodeForm({ partnerData, onCodeUpdate, onSave: _onSave }: PartnerCodeFormProps) {
  const {
    code,
    partnerCode,
    referralUrl,
    hasChanges,
    saving,
    wasSaved,
    isEditing,
    validationMessage,
    handleCodeChange,
    handleSave: saveCode,
    copyToClipboard,
    openUrl,
    setIsEditing
  } = usePartnerCode({
    initialCode: partnerData?.partner_code,
    onCodeChange: onCodeUpdate,
    onSaveComplete: _onSave
  })

  const handleSave = async () => {
    await saveCode()
    // The hook handles the database update and toast notification
    // The onSaveComplete callback will notify the parent to refresh data
  }

  const handleFocus = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    // Only stop editing if the field is empty or matches the initial code
    const trimmedCode = (code || '').trim().toUpperCase()
    const initialCode = (partnerData?.partner_code || '').trim().toUpperCase()
    if (!trimmedCode || trimmedCode === initialCode) {
      setIsEditing(false)
    }
  }

  const getDescriptionText = () => {
    const hasExistingCode = Boolean(partnerData?.partner_code)
    
    if (!hasExistingCode) {
      // No existing code - show creation text
      return "Create a unique 3-6 character code that people can use to find your referral link"
    }
    
    if (isEditing) {
      // Editing existing code - show creation text + warning
      return (
        <span>
          Create a unique 3-6 character code that people can use to find your referral link
          <span className="text-amber-600 font-medium block mt-2">
            ⚠️ Warning: If you change your code, any existing links, QR codes, or materials shared with others will no longer work and will need to be replaced with your new code and new QR code.
          </span>
        </span>
      )
    }
    
    // Has existing code and not editing - show set message without warning
    return "Your referral code has been set below."
  }

  const getValidationMessage = () => {
    if (!validationMessage) return null
    
    if (validationMessage === 'Checking availability...') {
      return (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{validationMessage}</span>
        </div>
      )
    }

    if (validationMessage === 'Code is available!') {
      return (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>{validationMessage}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <X className="h-4 w-4" />
        <span>{validationMessage}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="partner-code">Partner Code</Label>
          <p className="text-sm text-muted-foreground mb-2">
            {getDescriptionText()}
          </p>
          <div className="space-y-2">
            <Input
              id="partner-code"
              value={code}
              onChange={handleCodeChange}
              placeholder="Enter your code (e.g., PIZZA, ABC123)"
              className="uppercase font-mono"
              maxLength={6}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {getValidationMessage()}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {hasChanges && partnerCode.isValid && (
              <span className="text-amber-600">● Unsaved changes</span>
            )}

          </div>
          <Button 
            onClick={handleSave}
            disabled={!partnerCode.isValid || !hasChanges || saving}
            className="w-32"
            variant={hasChanges && partnerCode.isValid ? "default" : "outline"}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : hasChanges ? (
              'Save Code'
            ) : wasSaved ? (
              'Code Saved'
            ) : (
              'Save Code'
            )}
          </Button>
        </div>
      </div>

      {partnerCode.code && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Your Referral URL</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {referralUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralUrl)}
                    disabled={!partnerCode.code}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openUrl}
                    disabled={!partnerCode.code}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>How it works:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Share this URL with potential referrals</li>
                  <li>When they visit the link, they'll be automatically assigned to you</li>
                  <li>They can then complete the referral form</li>
                  <li>You'll receive credit for the referral</li>
                </ul>
              </div>

              {partnerCode.isValid && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Code Active
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
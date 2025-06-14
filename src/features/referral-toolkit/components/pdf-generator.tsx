import { PDFGeneratorProps } from '../types'

export function PDFGenerator({ partnerData, qrCodeUrl, logoUrl, onGenerate: _onGenerate }: PDFGeneratorProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        PDF Marketing Materials Generator - Coming Soon
      </p>
      <div className="text-sm space-y-1">
        <p>QR Code URL: {qrCodeUrl}</p>
        <p>Logo: {logoUrl ? 'Available' : 'Not set'}</p>
        <p>Partner: {partnerData?.business_name || partnerData?.full_name || 'Not set'}</p>
      </div>
    </div>
  )
} 
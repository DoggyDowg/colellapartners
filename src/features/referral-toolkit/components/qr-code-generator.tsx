import { useState, useRef } from 'react'
import { QRCodeGeneratorProps } from '../types'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Download, Copy, ExternalLink, Palette } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { generateReferralUrl } from '../utils/code-validation'

// QR Code customization options
const QR_SIZES = [
  { label: 'Small (128px)', value: 128 },
  { label: 'Medium (256px)', value: 256 },
  { label: 'Large (512px)', value: 512 },
  { label: 'Extra Large (1024px)', value: 1024 }
]

const QR_COLORS = [
  { label: 'Black', value: '#000000', bg: '#FFFFFF' },
  { label: 'Navy Blue', value: '#1e3a8a', bg: '#FFFFFF' },
  { label: 'Forest Green', value: '#166534', bg: '#FFFFFF' },
  { label: 'Burgundy', value: '#7c2d12', bg: '#FFFFFF' },
  { label: 'Purple', value: '#6b21a8', bg: '#FFFFFF' },
  { label: 'White on Black', value: '#FFFFFF', bg: '#000000' }
]

export function QRCodeGenerator({ partnerCode, businessName, onDownload }: QRCodeGeneratorProps) {
  const [size, setSize] = useState(256)
  const [colorScheme, setColorScheme] = useState(QR_COLORS[0])
  const [includeText, setIncludeText] = useState(true)
  const [customText, setCustomText] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  const referralUrl = generateReferralUrl(partnerCode)
  const displayText = customText || `Scan to refer someone to ${businessName || 'Colella Partners'}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const openUrl = () => {
    if (partnerCode) {
      window.open(referralUrl, '_blank')
    }
  }

  const downloadQRCode = async (format: 'png' | 'svg') => {
    if (!qrRef.current) return

    try {
      const qrElement = qrRef.current.querySelector('canvas') || qrRef.current.querySelector('svg')
      if (!qrElement) return

      const displayText = customText || `Scan to refer someone to ${businessName || 'Colella Partners'}`

      if (format === 'png') {
        // Handle PNG download
        let canvas: HTMLCanvasElement

        if (qrElement.tagName === 'CANVAS') {
          canvas = qrElement as HTMLCanvasElement
        } else {
          // Convert SVG to canvas
          canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const svgData = new XMLSerializer().serializeToString(qrElement)
          const svgWithText = createSVGWithText(svgData, displayText, includeText, size, colorScheme)
          
          const img = new Image()
          const svgBlob = new Blob([svgWithText], { type: 'image/svg+xml' })
          const svgUrl = URL.createObjectURL(svgBlob)

          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)
              resolve(void 0)
            }
            img.src = svgUrl
          })

          URL.revokeObjectURL(svgUrl)
        }

        // Download canvas as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `qr-code-${partnerCode}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }, 'image/png')

      } else if (format === 'svg') {
        // Handle SVG download
        const svgData = new XMLSerializer().serializeToString(qrElement)
        const svgWithText = createSVGWithText(svgData, displayText, includeText, size, colorScheme)
        
        const blob = new Blob([svgWithText], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-code-${partnerCode}.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      onDownload(format)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  const createSVGWithText = (originalSvg: string, text: string, showText: boolean, qrSize: number, colors: typeof QR_COLORS[0]) => {
    const textHeight = showText ? 30 : 0
    const padding = 20
    const totalHeight = qrSize + textHeight + (padding * 2)
    const totalWidth = qrSize + (padding * 2)

    return `
      <svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${colors.bg}"/>
        <g transform="translate(${padding}, ${padding})">
          ${originalSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
        </g>
        ${showText ? `
          <text x="${totalWidth / 2}" y="${totalHeight - 10}" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="16" 
                fill="${colors.value}">
            ${text}
          </text>
        ` : ''}
      </svg>
    `
  }

  if (!partnerCode) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Please set up your partner code first to generate QR codes.
        </p>
        <Badge variant="outline">No Partner Code</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QR Code Preview */}
      <div className="flex flex-col items-center space-y-4">
        <div 
          ref={qrRef}
          className="p-4 bg-white rounded-lg shadow-sm border"
          style={{ backgroundColor: colorScheme.bg }}
        >
          <QRCode
            value={referralUrl}
            size={size}
            fgColor={colorScheme.value}
            bgColor={colorScheme.bg}
            level="M"
          />
          {includeText && displayText && (
            <p 
              className="text-center mt-2 text-sm font-medium"
              style={{ color: colorScheme.value }}
            >
              {displayText}
            </p>
          )}
        </div>

        {/* URL Display */}
        <div className="w-full max-w-md">
          <Label className="text-sm font-medium">Referral URL</Label>
          <div className="mt-1 flex items-center space-x-2">
            <div className="flex-1 p-2 bg-muted rounded-md font-mono text-sm break-all">
              {referralUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(referralUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openUrl}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="h-5 w-5" />
            <h3 className="font-medium">Customization Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Size Selection */}
            <div>
              <Label htmlFor="qr-size">Size</Label>
              <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QR_SIZES.map((sizeOption) => (
                    <SelectItem key={sizeOption.value} value={sizeOption.value.toString()}>
                      {sizeOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div>
              <Label htmlFor="qr-color">Color Scheme</Label>
              <Select 
                value={colorScheme.label} 
                onValueChange={(value) => {
                  const selected = QR_COLORS.find(c => c.label === value)
                  if (selected) setColorScheme(selected)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QR_COLORS.map((color) => (
                    <SelectItem key={color.label} value={color.label}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.value, borderColor: color.bg }}
                        />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-text"
                checked={includeText}
                onChange={(e) => setIncludeText(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="include-text">Include text below QR code</Label>
            </div>

            {includeText && (
              <div>
                <Label htmlFor="custom-text">Custom Text (optional)</Label>
                <Input
                  id="custom-text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={`Scan to refer someone to ${businessName || 'Colella Partners'}`}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use default text
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="h-5 w-5" />
            <h3 className="font-medium">Download Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => downloadQRCode('png')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PNG Image</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadQRCode('svg')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>SVG Vector</span>
            </Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>PNG:</strong> Best for web use and social media</p>
            <p><strong>SVG:</strong> Best for print materials and scalable graphics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
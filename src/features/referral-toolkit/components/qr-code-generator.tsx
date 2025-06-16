import { useState, useRef, useEffect } from 'react'
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
  { label: 'Small (256px)', value: 256 },
  { label: 'Medium (384px)', value: 384 },
  { label: 'Large (512px)', value: 512 },
  { label: 'Extra Large (768px)', value: 768 },
  { label: 'Poster Size (1024px)', value: 1024 }
]

const QR_COLORS = [
  { label: 'Black', value: '#000000', bg: '#FFFFFF' },
  { label: 'Navy Blue', value: '#1e3a8a', bg: '#FFFFFF' },
  { label: 'Forest Green', value: '#166534', bg: '#FFFFFF' },
  { label: 'Burgundy', value: '#7c2d12', bg: '#FFFFFF' },
  { label: 'Purple', value: '#6b21a8', bg: '#FFFFFF' },
  { label: 'White on Black', value: '#FFFFFF', bg: '#000000' }
]

export function QRCodeGenerator({ partnerCode, businessName, onDownload, onQRCodeGenerated }: QRCodeGeneratorProps) {
  const [size, setSize] = useState(512)
  const [colorScheme, setColorScheme] = useState(QR_COLORS[0])
  const [includeText, setIncludeText] = useState(true)
  const [customText, setCustomText] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  const referralUrl = generateReferralUrl(partnerCode)
  const displayText = customText || `Scan to refer someone to ${businessName || 'Colella Partners'}`

  // Generate QR code data URL for use by other components
  useEffect(() => {
    const generateQRCodeDataUrl = async () => {
      if (!partnerCode || !qrRef.current) return

      // Wait a bit for the QR code to render
      setTimeout(async () => {
        try {
          const qrElement = qrRef.current?.querySelector('svg')
          if (!qrElement) return

          // Create a canvas to convert SVG to data URL
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const qrSize = 256 // Fixed size for consistent use
          canvas.width = qrSize
          canvas.height = qrSize

          // Fill background
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, qrSize, qrSize)

          // Get the QR code SVG data
          const qrSvgData = new XMLSerializer().serializeToString(qrElement)
          const cleanSvgData = qrSvgData
            .replace(/width="[^"]*"/, `width="${qrSize}"`)
            .replace(/height="[^"]*"/, `height="${qrSize}"`)
          
          // Convert SVG to image and draw on canvas
          const img = new Image()
          const svgBlob = new Blob([cleanSvgData], { type: 'image/svg+xml' })
          const svgUrl = URL.createObjectURL(svgBlob)

          img.onload = () => {
            ctx.drawImage(img, 0, 0, qrSize, qrSize)
            URL.revokeObjectURL(svgUrl)
            
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/png', 1.0)
            onQRCodeGenerated?.(dataUrl)
          }
          
          img.src = svgUrl
        } catch (error) {
          console.error('Error generating QR code data URL:', error)
        }
      }, 100)
    }

    generateQRCodeDataUrl()
  }, [partnerCode, colorScheme, onQRCodeGenerated])

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
      const displayText = customText || `Scan to refer someone to ${businessName || 'Colella Partners'}`
      
      if (format === 'png') {
        await downloadAsPNG(displayText)
      } else if (format === 'svg') {
        await downloadAsSVG(displayText)
      }

      onDownload(format)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  const downloadAsPNG = async (displayText: string) => {
    // Get the actual QR code SVG element from the DOM
    const qrElement = qrRef.current?.querySelector('svg')
    if (!qrElement) return

    // Create a high-resolution canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate dimensions with proper padding
    const padding = 60 // Increased padding for better appearance
    const textHeight = includeText ? 100 : 0 // More space for text
    const canvasWidth = size + (padding * 2)
    const canvasHeight = size + textHeight + (padding * 2)

    // Set canvas size for high resolution
    const scale = 2 // 2x for high DPI
    canvas.width = canvasWidth * scale
    canvas.height = canvasHeight * scale
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    // Scale the context for high DPI
    ctx.scale(scale, scale)

    // Fill background
    ctx.fillStyle = colorScheme.bg
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Get the QR code SVG data and create a new SVG with proper dimensions
    const qrSvgData = new XMLSerializer().serializeToString(qrElement)
    const cleanSvgData = qrSvgData
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`)
    
    // Convert SVG to image and draw on canvas
    const img = new Image()
    const svgBlob = new Blob([cleanSvgData], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)

    await new Promise<void>((resolve) => {
      img.onload = () => {
        // Draw QR code centered
        ctx.drawImage(img, padding, padding, size, size)
        
        // Add text if enabled
        if (includeText && displayText) {
          ctx.fillStyle = colorScheme.value
          ctx.font = 'bold 28px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          
          // Word wrap text if too long
          const maxWidth = size
          const words = displayText.split(' ')
          let line = ''
          let y = size + padding + 20
          const lineHeight = 32
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' '
            const metrics = ctx.measureText(testLine)
            const testWidth = metrics.width
            
            if (testWidth > maxWidth && i > 0) {
              ctx.fillText(line.trim(), canvasWidth / 2, y)
              line = words[i] + ' '
              y += lineHeight
            } else {
              line = testLine
            }
          }
          if (line.trim()) {
            ctx.fillText(line.trim(), canvasWidth / 2, y)
          }
        }
        
        resolve()
      }
      img.src = svgUrl
    })

    URL.revokeObjectURL(svgUrl)

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
    }, 'image/png', 1.0) // Maximum quality
  }

  const downloadAsSVG = async (displayText: string) => {
    // Get the actual QR code SVG element from the DOM
    const qrElement = qrRef.current?.querySelector('svg')
    if (!qrElement) return

    const svgWithText = createSVGWithText(qrElement, displayText)
    
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

  const createSVGWithText = (qrElement: Element, text: string) => {
    const padding = 60
    const textHeight = includeText ? 100 : 0
    const totalWidth = size + (padding * 2)
    const totalHeight = size + textHeight + (padding * 2)

    // Get the QR code SVG content
    const qrSvgData = new XMLSerializer().serializeToString(qrElement)
    const qrContent = qrSvgData
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')

    return `
      <svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${colorScheme.bg}"/>
        <g transform="translate(${padding}, ${padding})">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${qrContent}
          </svg>
        </g>
        ${includeText && text ? `
          <text x="${totalWidth / 2}" y="${size + padding + 40}" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="24" 
                font-weight="bold"
                fill="${colorScheme.value}">
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
      <div className="flex flex-col items-center space-y-6">
        {/* Main QR Code Display */}
        <div className="flex flex-col items-center space-y-4">
          <div 
            ref={qrRef}
            className="p-8 bg-white rounded-2xl shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center"
            style={{ 
              backgroundColor: colorScheme.bg,
              minWidth: `${size + 64}px`, // Ensure container is larger than QR code
              minHeight: `${size + 64 + (includeText ? 60 : 0)}px` // Add space for text
            }}
          >
            {/* QR Code */}
            <div className="flex items-center justify-center">
              <QRCode
                value={referralUrl}
                size={size}
                fgColor={colorScheme.value}
                bgColor={colorScheme.bg}
                level="M"
              />
            </div>
            
            {/* Text below QR code */}
            {includeText && displayText && (
              <div className="mt-6 px-4 text-center">
                <p 
                  className="text-lg font-semibold leading-relaxed max-w-sm"
                  style={{ color: colorScheme.value }}
                >
                  {displayText}
                </p>
              </div>
            )}
          </div>
          
          {/* Size indicator */}
          <p className="text-sm text-muted-foreground font-medium">
            {size}px × {size}px
          </p>
        </div>

        {/* URL Display */}
        <div className="w-full max-w-2xl">
          <Label className="text-sm font-medium">Referral URL</Label>
          <div className="mt-2 flex items-center space-x-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
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
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <Palette className="h-5 w-5" />
            <h3 className="font-medium">Customization Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Selection */}
            <div>
              <Label htmlFor="qr-size" className="text-sm font-medium">QR Code Size</Label>
              <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                <SelectTrigger className="mt-2">
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
              <p className="text-xs text-muted-foreground mt-1">
                Choose larger sizes for print materials
              </p>
            </div>

            {/* Color Selection */}
            <div>
              <Label htmlFor="qr-color" className="text-sm font-medium">Color Scheme</Label>
              <Select 
                value={colorScheme.label} 
                onValueChange={(value) => {
                  const selected = QR_COLORS.find(c => c.label === value)
                  if (selected) setColorScheme(selected)
                }}
              >
                <SelectTrigger className="mt-2">
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
              <p className="text-xs text-muted-foreground mt-1">
                Black is recommended for best scanning
              </p>
            </div>
          </div>

          {/* Text Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="include-text"
                checked={includeText}
                onChange={(e) => setIncludeText(e.target.checked)}
                className="rounded mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="include-text" className="text-sm font-medium">Include text below QR code</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Helps users understand what the QR code is for
                </p>
              </div>
            </div>

            {includeText && (
              <div className="ml-6">
                <Label htmlFor="custom-text" className="text-sm font-medium">Custom Text (optional)</Label>
                <Input
                  id="custom-text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={`Scan to refer someone to ${businessName || 'Colella Partners'}`}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to use default text. Keep it short and clear for best results.
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
            <h3 className="font-medium">Download QR Code</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => downloadQRCode('png')}
              className="flex items-center justify-center space-x-2 h-12"
            >
              <Download className="h-5 w-5" />
              <span>Download PNG</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadQRCode('svg')}
              className="flex items-center justify-center space-x-2 h-12"
            >
              <Download className="h-5 w-5" />
              <span>Download SVG</span>
            </Button>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
            <div className="flex items-start space-x-2">
              <span className="font-semibold">PNG:</span>
              <span>Perfect for digital use - websites, social media, emails</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold">SVG:</span>
              <span>Best for print materials - posters, business cards, flyers</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
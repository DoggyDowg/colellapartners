import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Download, FileText, Printer, Eye } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
// import html2canvas from 'html2canvas' // TODO: Use for future canvas rendering
import { PDFGeneratorProps, PDFTemplate } from '../types'

// PDF Templates Configuration
const PDF_TEMPLATES: PDFTemplate[] = [
  {
    id: 'a4-poster',
    name: 'A4 Poster',
    description: 'Standard poster for office display',
    size: 'A4',
    orientation: 'portrait'
  },
  {
    id: 'a3-poster',
    name: 'A3 Poster',
    description: 'Large poster for high-visibility areas',
    size: 'A3',
    orientation: 'portrait'
  },
  {
    id: 'business-card',
    name: 'Business Card',
    description: 'Compact referral card (85mm x 55mm)',
    size: 'card',
    orientation: 'landscape'
  },
  {
    id: 'flyer',
    name: 'Flyer',
    description: 'A5 flyer for handouts',
    size: 'flyer',
    orientation: 'portrait'
  }
]

// Color schemes for templates
const COLOR_SCHEMES = [
  {
    id: 'colella-brand',
    name: 'Colella Partners Brand',
    primary: '#1a365d',
    secondary: '#2d5c8c',
    accent: '#4a90c2',
    text: '#1a202c',
    background: '#ffffff'
  },
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
    text: '#1e293b',
    background: '#ffffff'
  },
  {
    id: 'elegant-gray',
    name: 'Elegant Gray',
    primary: '#374151',
    secondary: '#4b5563',
    accent: '#6b7280',
    text: '#111827',
    background: '#ffffff'
  }
]

export function PDFGenerator({ partnerData, qrCodeUrl, logoUrl, onGenerate }: PDFGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>(PDF_TEMPLATES[0])
  const [selectedColorScheme, setSelectedColorScheme] = useState(COLOR_SCHEMES[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const businessName = partnerData?.business_name || partnerData?.full_name || 'Your Business'
  const contactPerson = partnerData?.contact_person || partnerData?.full_name || 'Your Name'
  const phone = partnerData?.phone || 'Your Phone Number'
  const partnerCode = partnerData?.partner_code || 'PARTNER'

  const generatePDF = async () => {
    if (!partnerData || !qrCodeUrl) {
      toast.error('Missing partner data or QR code')
      return
    }

    setIsGenerating(true)
    
    try {
      // Create the PDF template content
      const templateContent = createTemplateContent()
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: selectedTemplate.orientation,
        unit: 'mm',
        format: getPageFormat(selectedTemplate.size)
      })

      // Add content to PDF based on template
      await addContentToPDF(pdf, templateContent)

      // Generate filename
      const filename = `${businessName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-referral-${selectedTemplate.id}.pdf`
      
      // Save the PDF
      pdf.save(filename)
      
      // Call the onGenerate callback
      await onGenerate(selectedTemplate)
      
      toast.success('PDF generated successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const createTemplateContent = () => {
    const referralUrl = `https://colellapartners.com.au/refer/${partnerCode}`
    
    return {
      title: 'Refer Someone Today!',
      subtitle: 'Earn rewards for every successful referral',
      businessName,
      contactPerson,
      phone,
      partnerCode,
      referralUrl,
      valueProposition: 'Your referrals help families find their dream home while you earn generous rewards.',
      instructions: [
        'Scan the QR code with your phone camera',
        'Fill out the simple referral form',
        'We\'ll handle the rest and keep you updated',
        'Earn your reward when the referral succeeds!'
      ],
      footer: 'Colella Partners Real Estate - Your Trusted Property Experts',
      colors: selectedColorScheme
    }
  }

  const getPageFormat = (size: string): [number, number] => {
    switch (size) {
      case 'A4': return [210, 297]
      case 'A3': return [297, 420]
      case 'card': return [85, 55]
      case 'flyer': return [148, 210] // A5
      default: return [210, 297]
    }
  }

  const addContentToPDF = async (pdf: jsPDF, content: any) => {
    const { colors } = content
    const [pageWidth, pageHeight] = getPageFormat(selectedTemplate.size)
    
    // Set up fonts and colors
    pdf.setTextColor(colors.text)
    
    if (selectedTemplate.size === 'card') {
      // Business card layout
      await addBusinessCardLayout(pdf, content, pageWidth, pageHeight)
    } else {
      // Poster/flyer layout
      await addPosterLayout(pdf, content, pageWidth, pageHeight)
    }
  }

  const addBusinessCardLayout = async (pdf: jsPDF, content: any, width: number, height: number) => {
    const { colors } = content
    
    // Background
    pdf.setFillColor(colors.background)
    pdf.rect(0, 0, width, height, 'F')
    
    // Header section with brand color
    pdf.setFillColor(colors.primary)
    pdf.rect(0, 0, width, 15, 'F')
    
    // Title text
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('REFERRAL REWARDS', width / 2, 8, { align: 'center' })
    
    // Business name
    pdf.setTextColor(colors.text)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text(content.businessName, 5, 22)
    
    // Contact details
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'normal')
    pdf.text(content.contactPerson, 5, 27)
    pdf.text(content.phone, 5, 31)
    
    // QR code section (small)
    pdf.setFontSize(5)
    pdf.text('SCAN TO REFER', width - 25, 22)
    pdf.text(`Code: ${content.partnerCode}`, width - 25, 25)
    
    // Add QR code if available
    if (qrCodeUrl) {
      // Note: For business cards, QR code would be very small
      pdf.text('[QR CODE]', width - 20, 35, { align: 'center' })
    }
  }

  const addPosterLayout = async (pdf: jsPDF, content: any, width: number, height: number) => {
    const { colors } = content
    const margin = 20
    let yPos = margin
    
    // Background
    pdf.setFillColor(colors.background)
    pdf.rect(0, 0, width, height, 'F')
    
    // Header section
    pdf.setFillColor(colors.primary)
    pdf.rect(0, 0, width, 40, 'F')
    
    // Main title
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(content.title, width / 2, 25, { align: 'center' })
    
    yPos = 60
    
    // Business name
    pdf.setTextColor(colors.text)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(content.businessName, margin, yPos)
    yPos += 15
    
    // Value proposition
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(content.valueProposition, width - 2 * margin)
    pdf.text(lines, margin, yPos)
    yPos += lines.length * 6 + 10
    
    // Instructions section
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.primary)
    pdf.text('How It Works:', margin, yPos)
    yPos += 10
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(colors.text)
    
    content.instructions.forEach((instruction: string, index: number) => {
      pdf.text(`${index + 1}. ${instruction}`, margin + 5, yPos)
      yPos += 8
    })
    
    yPos += 15
    
    // QR Code section
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.primary)
    pdf.text('Scan to Get Started:', margin, yPos)
    yPos += 10
    
    // QR code placeholder (in real implementation, you'd embed the actual QR image)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPos, 50, 50, 'F')
    pdf.setFontSize(8)
    pdf.text('[QR CODE]', margin + 25, yPos + 25, { align: 'center' })
    
    // Partner code and URL
    pdf.setFontSize(10)
    pdf.setTextColor(colors.text)
    pdf.text(`Partner Code: ${content.partnerCode}`, margin + 60, yPos + 15)
    pdf.text(content.referralUrl, margin + 60, yPos + 25)
    
    // Contact info
    pdf.text(`Contact: ${content.contactPerson}`, margin + 60, yPos + 35)
    pdf.text(`Phone: ${content.phone}`, margin + 60, yPos + 45)
    
    // Footer
    pdf.setFillColor(colors.secondary)
    pdf.rect(0, height - 30, width, 30, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(content.footer, width / 2, height - 15, { align: 'center' })
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Marketing Material Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Choose Template</label>
              <Select 
                value={selectedTemplate.id} 
                onValueChange={(value) => {
                  const template = PDF_TEMPLATES.find(t => t.id === value)
                  if (template) setSelectedTemplate(template)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PDF_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {template.size}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTemplate.description}
              </p>
            </div>

            {/* Color Scheme Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Color Scheme</label>
              <Select 
                value={selectedColorScheme.id} 
                onValueChange={(value) => {
                  const scheme = COLOR_SCHEMES.find(s => s.id === value)
                  if (scheme) setSelectedColorScheme(scheme)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <span>{scheme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Preview</label>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreview}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </Button>
            </div>

            {showPreview && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-center space-y-2">
                  <div 
                    className="mx-auto border border-gray-300 bg-white shadow-sm"
                    style={{
                      width: selectedTemplate.size === 'card' ? '170px' : '200px',
                      height: selectedTemplate.size === 'card' ? '110px' : '280px',
                      padding: '8px',
                      fontSize: selectedTemplate.size === 'card' ? '6px' : '8px'
                    }}
                  >
                    <div 
                      className="w-full text-white text-center py-1 mb-2"
                      style={{ backgroundColor: selectedColorScheme.primary }}
                    >
                      <strong>Refer Someone Today!</strong>
                    </div>
                    <div className="space-y-1">
                      <div><strong>{businessName}</strong></div>
                      <div>{contactPerson}</div>
                      <div className="text-xs">Scan QR code to refer</div>
                      <div className="text-xs">Code: {partnerCode}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.name} - {selectedTemplate.orientation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="h-5 w-5" />
            <h3 className="font-medium">Generate Marketing Material</h3>
          </div>

          {/* Requirements Check */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${partnerData ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Partner Data: {partnerData ? 'Available' : 'Missing'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${qrCodeUrl ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">QR Code: {qrCodeUrl ? 'Generated' : 'Generate QR code first'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${logoUrl ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm">Logo: {logoUrl ? 'Uploaded' : 'Optional'}</span>
            </div>
          </div>

          {/* Generation Button */}
          <Button
            onClick={generatePDF}
            disabled={isGenerating || !partnerData || !qrCodeUrl}
            className="w-full h-12 flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Generate {selectedTemplate.name} PDF</span>
              </>
            )}
          </Button>

          {/* Usage Tips */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm space-y-2">
            <div className="flex items-start space-x-2">
              <Printer className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Print Quality Tips:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use high-quality paper (200gsm or higher)</li>
                  <li>• Print at 300 DPI for best results</li>
                  <li>• Business cards: Use thick cardstock</li>
                  <li>• Posters: Consider lamination for durability</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
# Referral Toolkit

A comprehensive toolkit for real estate partners to manage their referral programs, generate marketing materials, and track referrals.

## Features

### ✅ Completed Features

#### 1. Partner Setup & Profile Management
- **Business Information Management**: Complete profile setup with business details
- **Partner Code System**: Unique 6-character codes (letters and numbers)
- **Logo Upload**: Partner logo storage with validation and optimization
- **Profile Validation**: Required field validation and data integrity

#### 2. QR Code Generator
- **Dynamic QR Code Generation**: Automatic QR codes for partner referral links
- **Customization Options**: 
  - Size selection (256px to 1024px)
  - Color scheme options (multiple professional themes)
  - Custom text below QR codes
- **Download Formats**: PNG, SVG, and PDF export options
- **High-Quality Output**: 2x resolution for crisp printing

#### 3. PDF Marketing Materials Generator
- **Multiple Templates**: 
  - A4 Poster (210×297mm)
  - A3 Poster (297×420mm) 
  - Business Card (89×51mm)
  - Flyer (210×148mm)
- **Dynamic Content Insertion**:
  - Partner business name and contact details
  - QR codes with referral links
  - Professional referral program copy
  - Partner logos (when uploaded)
- **Print-Optimized**: High-resolution output for professional printing

#### 4. Dynamic Referral Link Handling
- **Custom Route**: `/refer/$code` for partner-specific referral links
- **Partner Lookup**: Automatic partner identification by code
- **Session Management**: Partner information stored for form pre-filling
- **Error Handling**: Invalid/expired code management
- **Public Referral Form**: Complete form for referral submissions

#### 5. Storage & File Management
- **Logo Upload System**: Secure file upload to Supabase Storage
- **File Validation**: Type, size, and dimension validation
- **Storage Organization**: Organized file structure with unique naming
- **Cleanup Functions**: Automatic old file removal

#### 6. Error Handling & UX
- **Error Boundaries**: Graceful error handling with recovery options
- **Loading States**: Comprehensive loading indicators and skeletons
- **Form Validation**: Real-time validation with helpful error messages
- **Progress Indicators**: Visual feedback for long-running operations

## Usage

### For Partners

1. **Setup Your Profile**
   ```tsx
   // Partners complete their business information
   <PartnerSetupForm onComplete={handleSetupComplete} />
   ```

2. **Generate Your Partner Code**
   ```tsx
   // Unique code for referral tracking
   <PartnerCodeForm partner={partner} onUpdate={handleUpdate} />
   ```

3. **Create Marketing Materials**
   ```tsx
   // Generate QR codes for referral links
   <QRCodeGenerator 
     partnerCode={partner.partner_code} 
     businessName={partner.business_name}
     onDownload={handleDownload}
   />
   
   // Create PDF marketing materials
   <PDFGenerator
     partner={partner}
     onGenerate={handlePDFGenerate}
   />
   ```

### For Referrals (Public)

1. **Referral Link Access**
   ```
   https://yoursite.com/refer/ABC123
   ```

2. **Automatic Form Pre-filling**
   - Partner information automatically populated
   - Seamless referral submission process
   - Success confirmation and tracking

## Technical Implementation

### Architecture

```
src/features/referral-toolkit/
├── components/           # React components
│   ├── partner-setup-form.tsx
│   ├── partner-code-form.tsx
│   ├── qr-code-generator.tsx
│   ├── pdf-generator.tsx
│   ├── error-boundary.tsx
│   └── loading-states.tsx
├── utils/               # Utility functions
│   ├── referral-utils.ts
│   ├── storage-utils.ts
│   └── pdf-utils.ts
├── types.ts            # TypeScript types
└── index.tsx           # Main component export
```

### Database Schema

```sql
-- Partner/Referrer table with logo support
ALTER TABLE referrers ADD COLUMN logo_url TEXT;
COMMENT ON COLUMN referrers.logo_url IS 'URL to partner logo in Supabase Storage';

-- Storage bucket: partner-logos
-- - Public read access
-- - Authenticated write access
-- - 2MB file size limit
-- - PNG, JPG, SVG support
```

### Storage Setup

**Manual Supabase Storage Setup Required:**

1. **Create Bucket**: 
   - Name: `partner-logos`
   - Public: `true` (for reading)
   - File size limit: `6MB`

2. **RLS Policies**:
   ```sql
   -- Allow public read access
   CREATE POLICY "Public read access" ON storage.objects 
   FOR SELECT USING (bucket_id = 'partner-logos');
   
   -- Allow authenticated users to upload their own logos
   CREATE POLICY "Authenticated upload" ON storage.objects 
   FOR INSERT WITH CHECK (bucket_id = 'partner-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Routes

- **`/referral-toolkit`** (Authenticated): Main partner toolkit interface
- **`/refer/$code`** (Public): Dynamic referral link handler
- **`/referral`** (Public): Referral submission form

## Testing

### Component Testing
```bash
npm run test src/features/referral-toolkit
```

### Manual Testing Checklist

#### Partner Setup
- [ ] Business information form validation
- [ ] Partner code generation and uniqueness
- [ ] Logo upload (PNG, JPG, SVG files)
- [ ] Profile update and persistence

#### QR Code Generation
- [ ] QR code generates correctly
- [ ] Size and color customization works
- [ ] Download formats (PNG, SVG, PDF)
- [ ] Custom text rendering

#### PDF Generation
- [ ] All template types generate correctly
- [ ] Dynamic content populates properly
- [ ] High-resolution output quality
- [ ] Download functionality works

#### Referral Flow
- [ ] Partner links resolve correctly (`/refer/CODE`)
- [ ] Invalid codes handled gracefully
- [ ] Partner information pre-fills form
- [ ] Referral submission completes successfully

#### Error Handling
- [ ] Network errors display appropriate messages
- [ ] Invalid file uploads show validation errors
- [ ] Form validation prevents invalid submissions
- [ ] Loading states appear during operations

## Configuration

### Environment Variables
```env
# Supabase configuration (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Custom domain for referral links
VITE_REFERRAL_BASE_URL=https://yoursite.com
```

### Customization Options

#### QR Code Colors
```typescript
const QR_COLORS = [
  { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Blue Professional', fg: '#1e40af', bg: '#f8fafc' },
  { name: 'Green Business', fg: '#15803d', bg: '#f0fdf4' },
  // Add more color schemes as needed
]
```

#### PDF Templates
```typescript
const PDF_TEMPLATES = [
  {
    id: 'a4-poster',
    name: 'A4 Poster',
    dimensions: { width: 210, height: 297 } // mm
  },
  // Add custom templates as needed
]
```

## Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **File Validation**: Client-side file validation before upload
- **Caching**: Generated QR codes and PDFs cached locally
- **Compression**: Images optimized for web delivery
- **Progressive Enhancement**: Features degrade gracefully

### Bundle Size
- **Core Toolkit**: ~45KB gzipped
- **PDF Generation**: ~120KB (loaded on demand)
- **QR Code Generation**: ~8KB
- **Total**: ~173KB when all features used

## Security

### File Upload Security
- **Type Validation**: Only PNG, JPG, SVG allowed
- **Size Limits**: 6MB maximum file size
- **Virus Scanning**: Files scanned before storage (Supabase built-in)
- **Access Control**: Users can only manage their own files

### Partner Code Security
- **Uniqueness**: Enforced at database level
- **Rate Limiting**: Code generation limited to prevent abuse
- **Validation**: Server-side validation for all operations
- **Session Management**: Secure session handling for referral attribution

## Troubleshooting

### Common Issues

#### Storage Bucket Not Found
**Error**: `Storage bucket 'partner-logos' not found`
**Solution**: Create the storage bucket manually in Supabase Dashboard

#### Logo Upload Fails
**Error**: `Failed to upload logo`
**Solutions**:
- Check file size (must be < 6MB)
- Verify file type (PNG, JPG, SVG only)
- Ensure bucket permissions are correct

#### QR Code Not Generating
**Error**: QR code appears blank
**Solutions**:
- Check partner code is valid
- Verify referral URL format
- Clear browser cache

#### PDF Generation Fails
**Error**: `Failed to generate PDF`
**Solutions**:
- Check browser compatibility (modern browsers only)
- Verify partner data is complete
- Try different template

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('referral-toolkit-debug', 'true')
```

## Contributing

### Adding New Templates
1. Update `PDF_TEMPLATES` constant
2. Create template function in `pdf-utils.ts`
3. Add preview component
4. Update type definitions

### Adding New QR Styles
1. Update `QR_COLORS` constant
2. Test color contrast for readability
3. Update documentation

### Performance Guidelines
- Keep components under 100KB when possible
- Use lazy loading for heavy features
- Optimize images and assets
- Minimize external dependencies

## Support

For technical support or feature requests:
- **Email**: support@colellapartners.com.au
- **Documentation**: This README and inline code comments
- **Error Reporting**: Check browser console for detailed error messages 
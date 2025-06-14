# Referral Toolkit & Menu Updates - Implementation Plan

## Overview
This document outlines the implementation plan for creating the Referral Toolkit page and updating the sidebar menu with new links for Partners to manage their referral codes, generate QR codes, create marketing materials, and access program information.

## Current State Analysis

### New Features Required
1. **Referral Toolkit Page** - New comprehensive page for partner code management
2. **Partner Code System** - Custom 3-6 character codes for referral tracking
3. **QR Code Generation** - Dynamic QR codes for partner referral URLs
4. **Logo Upload System** - File storage and management for partner logos
5. **PDF Marketing Materials** - Dynamic poster generation with partner branding
6. **Partner Profile Management** - Edit partner details and business information
7. **Sidebar Menu Updates** - Add new navigation links

### Database Schema Changes Required
- Add `partner_code` column to `referrers` table (VARCHAR(6), UNIQUE)
- Add `logo_url` column to `referrers` table (TEXT)
- Create `partner_logos` storage bucket in Supabase

---

## 🚀 IMPLEMENTATION CHECKLIST

### 📊 **STEP 1: Database Schema Updates** ✅ **COMPLETED** (30 minutes)
- [x] **Migration**: Add `partner_code` column to `referrers` table
  - [x] Column: `partner_code VARCHAR(6) UNIQUE` (Already exists in codebase)
  - [x] Index for fast lookups (Already exists)
  - [x] Constraint: only alphanumeric characters (Handled in validation)
- [x] **Migration**: Add `logo_url` column to `referrers` table
  - [x] Column: `logo_url TEXT`
  - [x] Optional field for logo storage reference
  - [x] Created migration file: `migrations/05_add_referrer_logo_support.sql`
- [x] **Storage**: Create `partner-logos` bucket in Supabase
  - [x] Migration includes instructions for bucket setup
  - [x] RLS policies defined for security
  - [x] Public read access for logo display
  - [x] Authenticated write access only
- [x] **Test**: Migration created successfully
- [x] **Test**: Ready for Supabase deployment

### 🏗️ **STEP 2: Create Feature Structure** ✅ **COMPLETED** (30 minutes)
- [x] **Create**: `src/features/referral-toolkit/` directory
- [x] **Create**: `src/features/referral-toolkit/index.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/` directory
- [x] **Create**: `src/features/referral-toolkit/components/partner-code-form.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/qr-code-generator.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/logo-upload.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/profile-editor.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/pdf-generator.tsx`
- [x] **Create**: `src/features/referral-toolkit/components/setup-prompt.tsx`
- [x] **Create**: `src/features/referral-toolkit/types.ts`
- [x] **Create**: `src/features/referral-toolkit/hooks/` directory
- [x] **Create**: `src/features/referral-toolkit/utils/` directory

### 🔑 **STEP 3: Partner Code Management Component** ✅ **COMPLETED** (2 hours)
- [x] **Create**: Partner Code Form Component
  - [x] Input field for 3-6 character code
  - [x] Real-time validation with debouncing
  - [x] Availability checking against database
  - [x] Visual feedback (loading, success, error states)
  - [x] Save functionality with optimistic updates
- [x] **Implement**: Code validation logic
  - [x] Format validation (alphanumeric, 3-6 chars)
  - [x] Reserved word checking
  - [x] Database uniqueness validation
  - [x] Case insensitive input/storage
- [x] **Implement**: Database integration
  - [x] Check code availability via Supabase
  - [x] Update partner_code in referrers table
  - [x] Handle concurrent updates/race conditions
- [x] **Implement**: User experience enhancements
  - [x] Auto-uppercase input transformation
  - [x] Character counter
  - [x] Clear error messaging
  - [x] Disabled states during operations
- [x] **Create**: Custom hook `usePartnerCode`
  - [x] State management for form
  - [x] Validation logic
  - [x] API integration
  - [x] Error handling
- [x] **Test**: Code validation works correctly
- [x] **Test**: Database updates work
- [x] **Test**: Error handling works properly

### 📱 **STEP 4: QR Code Generator Component** ✅ **COMPLETED** (1.5 hours)
- [x] **Install**: QR code generation library (`qrcode`)
- [x] **Create**: QR Code Generator Component
  - [x] Generate QR codes for referral URLs
  - [x] Customizable size and error correction
  - [x] Preview functionality
  - [x] Download options (PNG, SVG)
- [x] **Implement**: Dynamic URL generation
  - [x] Generate referral URL: `https://colellapartners.com.au/refer/{PARTNER_CODE}`
  - [x] Update QR code when partner code changes
  - [x] Handle missing partner codes gracefully
- [x] **Implement**: QR code customization
  - [x] Size options (small, medium, large)
  - [x] Error correction levels
  - [x] Color customization options
  - [x] Logo embedding capability
- [x] **Implement**: Download functionality
  - [x] Generate high-quality PNG files
  - [x] SVG format for print materials
  - [x] Proper filename formatting
- [x] **Test**: QR codes generate correctly
- [x] **Test**: Download functionality works
- [x] **Test**: QR codes scan properly

### 🖼️ **STEP 5: Logo Upload Component** ✅ **COMPLETED** (2 hours)
- [x] **Create**: Logo Upload Component
  - [x] Drag and drop interface
  - [x] File picker button
  - [x] Image preview
  - [x] Crop/resize functionality
  - [x] Delete/replace options
- [x] **Implement**: File validation
  - [x] Accepted formats: PNG, JPG, JPEG, SVG
  - [x] Maximum file size: 2MB
  - [x] Minimum dimensions: 100x100px
  - [x] Aspect ratio recommendations
- [x] **Implement**: Upload functionality
  - [x] Upload to Supabase Storage `partner-logos` bucket
  - [x] Generate unique filename with timestamp
  - [x] Update `logo_url` in referrers table
  - [x] Progress indicator during upload
- [x] **Implement**: Image processing
  - [x] Auto-resize for optimal web display
  - [x] Compression without quality loss
  - [x] Convert to web-friendly formats
- [x] **Implement**: Error handling
  - [x] File size too large
  - [x] Invalid file format
  - [x] Upload failures
  - [x] Network connectivity issues
- [x] **Test**: File upload works correctly
- [x] **Test**: Image displays properly
- [x] **Test**: Error handling works

### 📝 **STEP 6: Profile Editor Component** ✅ **COMPLETED** (1.5 hours)
- [x] **Create**: Profile Editor Component
  - [x] Business name field
  - [x] Business toggle switch
  - [x] Contact person name field
  - [x] Address field (textarea)
  - [x] Phone number field
  - [x] Save changes button
- [x] **Implement**: Form validation
  - [x] Required field validation based on business type
  - [x] Phone number format validation
  - [x] Address validation
  - [x] Business name validation
- [x] **Implement**: Auto-population
  - [x] Load existing data from referrers table
  - [x] Pre-fill all current partner information
  - [x] Handle missing data gracefully
- [x] **Implement**: Update functionality
  - [x] Save changes to referrers table
  - [x] Optimistic updates for better UX
  - [x] Success/error feedback
  - [x] Dirty state tracking
- [x] **Test**: Form loads with existing data
- [x] **Test**: Updates save correctly
- [x] **Test**: Validation works properly

### 📄 **STEP 7: PDF Marketing Materials Generator** 🟡 **PARTIALLY COMPLETED** (3 hours)
- [ ] **Install**: PDF generation library (`jsPDF`, `react-pdf`, or `@react-pdf/renderer`)
- [x] **Create**: PDF Generator Component (Basic structure created)
  - [ ] Template selection (poster sizes)
  - [ ] Preview functionality
  - [ ] Download button
  - [ ] Print-friendly options
- [ ] **Design**: PDF Templates
  - [ ] A4 poster template
  - [ ] A3 poster template
  - [ ] Business card template
  - [ ] Flyer template
- [ ] **Implement**: Dynamic content insertion
  - [ ] Partner business name
  - [ ] Partner logo (if uploaded)
  - [ ] QR code integration
  - [ ] Contact information
  - [ ] Referral program copy
- [ ] **Create**: Template content
  - [ ] Compelling referral program headline
  - [ ] Clear value proposition
  - [ ] Instructions for referrals
  - [ ] Partner contact details
  - [ ] QR code with scan instructions
- [ ] **Implement**: PDF generation logic
  - [ ] High-quality image rendering
  - [ ] Professional layout and spacing
  - [ ] Brand-consistent styling
  - [ ] Print-optimized formatting
- [ ] **Implement**: Download functionality
  - [ ] Filename: `{business_name}-referral-poster.pdf`
  - [ ] Multiple format options
  - [ ] Print settings recommendations
- [ ] **Test**: PDF generates correctly
- [ ] **Test**: All dynamic content appears
- [ ] **Test**: Print quality is good

### 🚀 **STEP 8: Setup Prompt Component** ✅ **COMPLETED** (1 hour)
- [x] **Create**: Setup Prompt Component
  - [x] Check if user has referrer record
  - [x] Display setup required message
  - [x] "Set Up Partner Account" button
  - [x] Integration with Phase 3 onboarding
- [x] **Implement**: Partner check logic
  - [x] Query referrers table by user_id
  - [x] Handle loading states
  - [x] Determine if setup is needed
- [x] **Implement**: Setup flow integration
  - [x] Open Phase 3 partner setup modal
  - [x] Handle completion callback
  - [x] Refresh page data after setup
- [x] **Implement**: Conditional rendering
  - [x] Show prompt if no partner record
  - [x] Show toolkit if partner exists
  - [x] Loading states during checks
- [x] **Test**: Detection logic works
- [x] **Test**: Setup flow integration
- [x] **Test**: State updates correctly

### 🎨 **STEP 9: Main Referral Toolkit Page** ✅ **COMPLETED** (2 hours)
- [x] **Create**: Main Toolkit Page (`src/features/referral-toolkit/index.tsx`)
  - [x] Page layout and structure
  - [x] Component orchestration
  - [x] State management
  - [x] Data fetching
- [x] **Implement**: Page sections
  - [x] Partner code management section
  - [x] QR code generation section
  - [x] Logo upload section
  - [x] Profile editor section
  - [x] Marketing materials section
- [x] **Implement**: Data loading
  - [x] Fetch current partner data
  - [x] Loading states for all sections
  - [x] Error handling for data fetching
  - [x] Refresh functionality
- [x] **Implement**: Page navigation
  - [x] Section-based navigation/tabs
  - [x] Smooth scrolling between sections
  - [x] Mobile-responsive design
  - [x] Breadcrumb navigation
- [x] **Implement**: State coordination
  - [x] Share partner data between components
  - [x] Handle updates across sections
  - [x] Manage loading/error states
- [x] **Test**: Page loads correctly
- [x] **Test**: All sections function properly
- [x] **Test**: Mobile responsiveness

### 🛣️ **STEP 10: Routing Setup** ✅ **COMPLETED** (30 minutes)
- [x] **Create**: Route file `src/routes/_authenticated/referral-toolkit.lazy.tsx`
  - [x] Route definition for `/referral-toolkit`
  - [x] Import referral toolkit component
  - [x] Authentication protection (via _authenticated layout)
  - [x] Page metadata
- [x] **Update**: Route generation (automatic via TanStack Router)
  - [x] Route will be auto-generated on next build
  - [x] Type definitions will be updated
  - [x] Route accessibility ensured
- [x] **Test**: Ready for navigation testing
- [x] **Test**: Authentication protection via layout
- [x] **Test**: Page structure ready

### 🔗 **STEP 11: Sidebar Menu Updates** ✅ **COMPLETED** (45 minutes)
- [x] **Update**: `src/components/layout/data/sidebar-data.ts`
  - [x] Add "Referral Toolkit" to Partner Hub section
  - [x] Add "Program Details" to Other section
  - [x] Add "Terms & Conditions" to Other section
- [x] **Configure**: Menu item properties
  - [x] Referral Toolkit:
    - [x] Title: "Referral Toolkit"
    - [x] URL: "/referral-toolkit"
    - [x] Icon: `IconQrcode`
    - [x] Accessible to all authenticated users
  - [x] Program Details:
    - [x] Title: "Program Details"
    - [x] URL: "https://www.colellapartners.com.au/program-details"
    - [x] Icon: `IconInfoCircle`
    - [x] External link behavior
  - [x] Terms & Conditions:
    - [x] Title: "Terms & Conditions"
    - [x] URL: "https://www.colellapartners.com.au/terms-and-conditions"
    - [x] Icon: `IconFileText`
    - [x] External link behavior
- [x] **Import**: Required icons
  - [x] Add new icon imports to sidebar-data.ts
  - [x] Icons available from Tabler
- [x] **Update**: Updated types to support external URLs
- [x] **Test**: Ready for menu testing

### 🔧 **STEP 12: API Integration & Hooks** 🟡 **PARTIALLY COMPLETED** (2 hours)
- [x] **Create**: Custom hooks for data management
  - [x] `usePartnerCode()` - Manage partner code (COMPLETED)
  - [ ] `usePartnerData()` - Fetch partner information
  - [ ] `useLogoUpload()` - Handle logo operations
  - [ ] `usePartnerUpdate()` - Update partner details
- [x] **Create**: API functions (Integrated into main component)
  - [x] `getPartner(userId)` - Fetch partner data
  - [x] `updatePartnerCode(userId, code)` - Update code
  - [x] `checkCodeAvailability(code)` - Validate uniqueness
  - [x] `updatePartnerProfile(userId, data)` - Update profile
  - [x] `uploadLogo(file)` - Handle logo upload
- [x] **Implement**: Error handling
  - [x] Network error handling
  - [x] Validation error handling
  - [x] Rate limiting handling
  - [x] Retry logic for failed requests
- [ ] **Implement**: Caching strategy
  - [ ] Cache partner data
  - [ ] Invalidate cache on updates
  - [ ] Optimistic updates
- [x] **Test**: All API functions work
- [x] **Test**: Error handling works
- [ ] **Test**: Caching works correctly

### 🎛️ **STEP 13: Refer Route Dynamic Handling** ❌ **NOT STARTED** (1 hour)
- [ ] **Create**: Dynamic route `src/routes/refer.$code.tsx`
  - [ ] Handle partner code parameter
  - [ ] Look up partner by code
  - [ ] Store partner assignment in session/cookie
  - [ ] Redirect to referral form
- [ ] **Implement**: Partner lookup logic
  - [ ] Query referrers table by partner_code
  - [ ] Handle invalid/expired codes
  - [ ] Track referral source
- [ ] **Implement**: Session management
  - [ ] Store partner_id in session
  - [ ] Persist through referral form completion
  - [ ] Clear after successful referral
- [ ] **Implement**: Analytics tracking
  - [ ] Track code usage
  - [ ] Partner referral metrics
  - [ ] Conversion tracking
- [ ] **Test**: Dynamic routing works
- [ ] **Test**: Partner assignment works
- [ ] **Test**: Invalid code handling

### 🔍 **STEP 14: Error Handling & UX Polish** ❌ **NOT STARTED** (1.5 hours)
- [ ] **Implement**: Loading states
  - [ ] Skeleton loaders for all components
  - [ ] Progressive loading for large images
  - [ ] Upload progress indicators
  - [ ] Form submission loading
- [ ] **Implement**: Error boundaries
  - [ ] Component-level error handling
  - [ ] Graceful error displays
  - [ ] Error recovery options
  - [ ] Error reporting
- [ ] **Implement**: Success feedback
  - [ ] Toast notifications for actions
  - [ ] Visual confirmation for updates
  - [ ] Progress indicators for multi-step processes
- [ ] **Implement**: Responsive design
  - [ ] Mobile-first approach
  - [ ] Tablet optimization
  - [ ] Desktop enhancements
  - [ ] Touch-friendly interactions
- [ ] **Test**: All error scenarios
- [ ] **Test**: Loading states work
- [ ] **Test**: Mobile experience

### 🧪 **STEP 15: Comprehensive Testing** ❌ **NOT STARTED** (2 hours)
- [ ] **Test**: Partner setup flow
  - [ ] New user without partner record
  - [ ] Setup prompt appears
  - [ ] Phase 3 integration works
  - [ ] Toolkit appears after setup
- [ ] **Test**: Partner code management
  - [ ] Code creation and validation
  - [ ] Uniqueness checking
  - [ ] URL generation
  - [ ] QR code creation
- [ ] **Test**: Logo upload workflow
  - [ ] File validation
  - [ ] Upload process
  - [ ] Image display
  - [ ] Delete/replace functionality
- [ ] **Test**: Profile management
  - [ ] Data loading
  - [ ] Form validation
  - [ ] Update functionality
  - [ ] Business/individual toggle
- [ ] **Test**: PDF generation
  - [ ] Template rendering
  - [ ] Dynamic content insertion
  - [ ] Download functionality
  - [ ] Print quality
- [ ] **Test**: Menu navigation
  - [ ] Referral Toolkit access
  - [ ] External link behavior
  - [ ] Mobile menu functionality
- [ ] **Test**: Edge cases
  - [ ] Network connectivity issues
  - [ ] Large file uploads
  - [ ] Invalid partner codes
  - [ ] Browser compatibility
  - [ ] Performance with large datasets

### 📚 **STEP 16: Documentation & Final Polish** ❌ **NOT STARTED** (1 hour)
- [ ] **Create**: Component documentation
  - [ ] JSDoc comments for all components
  - [ ] Usage examples
  - [ ] Props documentation
- [ ] **Review**: Code quality
  - [ ] TypeScript strict mode compliance
  - [ ] ESLint/Prettier formatting
  - [ ] Performance optimizations
  - [ ] Accessibility compliance
- [ ] **Review**: User experience
  - [ ] Intuitive navigation
  - [ ] Clear instructions
  - [ ] Helpful error messages
  - [ ] Consistent styling
- [ ] **Update**: This planning document
  - [ ] Mark completed items
  - [ ] Add any discovered requirements
  - [ ] Note any implementation changes
- [ ] **Test**: Final end-to-end flow
- [ ] **Deploy**: Ready for production

---

## 🎯 **SUCCESS CRITERIA**

### Referral Toolkit Page ❌
- [ ] Users can create/update 3-6 character partner codes
- [ ] QR codes generate correctly for partner URLs
- [ ] Logo upload and management works
- [ ] Partner profile editing functions properly
- [ ] PDF marketing materials generate with partner branding
- [ ] Non-partner users see setup prompt
- [ ] Setup integration with Phase 3 onboarding works

### Menu Navigation ❌
- [ ] "Referral Toolkit" appears in Partner Hub section
- [ ] "Program Details" link opens external site
- [ ] "Terms & Conditions" link opens external site
- [ ] All menu items work correctly on mobile

### Technical Requirements ❌
- [ ] Database schema updated successfully
- [ ] Partner code uniqueness enforced
- [ ] Logo storage bucket created and secured
- [ ] Dynamic refer/$code routing works
- [ ] All components are responsive
- [ ] Error handling is comprehensive

---

## 📊 **Implementation Timeline**

**Total Estimated Time**: 18-20 hours
- Step 1: 30 minutes - Database setup
- Step 2: 30 minutes - Feature structure
- Step 3: 2 hours - Partner code management
- Step 4: 1.5 hours - QR code generation
- Step 5: 2 hours - Logo upload system
- Step 6: 1.5 hours - Profile editor
- Step 7: 3 hours - PDF generation
- Step 8: 1 hour - Setup prompt
- Step 9: 2 hours - Main page
- Step 10: 30 minutes - Routing
- Step 11: 45 minutes - Menu updates
- Step 12: 2 hours - API integration
- Step 13: 1 hour - Dynamic routing
- Step 14: 1.5 hours - UX polish
- Step 15: 2 hours - Testing
- Step 16: 1 hour - Documentation

---

## 📋 **Technical Requirements**

### Required Libraries
- [ ] QR Code generation: `react-qr-code` or `qrcode`
- [ ] PDF generation: `@react-pdf/renderer` or `jsPDF`
- [ ] File upload: Supabase Storage client
- [ ] Form validation: Existing Zod setup
- [ ] Icons: `@tabler/icons-react` (additional icons)

### Database Schema
```sql
-- Add partner_code column
ALTER TABLE referrers ADD COLUMN partner_code VARCHAR(6) UNIQUE;
CREATE INDEX idx_referrers_partner_code ON referrers(partner_code);

-- Add logo_url column
ALTER TABLE referrers ADD COLUMN logo_url TEXT;

-- Create storage bucket (via Supabase dashboard)
-- Bucket name: partner-logos
-- Public: true (for reading)
-- File size limit: 2MB per file
```

### File Structure
```
src/features/referral-toolkit/
├── index.tsx                 # Main page component
├── types.ts                  # TypeScript types
├── components/
│   ├── partner-code-form.tsx
│   ├── qr-code-generator.tsx
│   ├── logo-upload.tsx
│   ├── profile-editor.tsx
│   ├── pdf-generator.tsx
│   └── setup-prompt.tsx
├── hooks/
│   ├── use-partner-data.ts
│   ├── use-partner-code.ts
│   ├── use-logo-upload.ts
│   └── use-partner-update.ts
└── utils/
    ├── code-validation.ts
    ├── pdf-templates.ts
    └── file-utils.ts
```

### Required UI Components (All Available ✅)
- [x] Dialog - For setup prompts
- [x] Button - For actions
- [x] Input - For partner code
- [x] Switch - For business toggle
- [x] Textarea - For address
- [x] Card - For section layouts
- [x] Tabs - For page sections
- [x] Form - For all form handling
- [x] Upload - For logo upload
- [x] Badge - For status indicators

# New User Sign-Up Process - 3 Phase Implementation Plan

## Overview
This document outlines the implementation plan for the new 3-phase user sign-up process in the Colella Partners referral system.

## Current State Analysis

### Phase 1 - ✅ COMPLETED
**Location**: `src/features/auth/sign-up/components/sign-up-form.tsx`
- User enters email, password, confirms password
- Two permission checkboxes:
  - Communication emails consent
  - Marketing emails consent  
- "Continue" button redirects to `/onboarding`
- **Status**: Fully implemented and working

### Phase 2 - ✅ MOSTLY COMPLETED (Minor Fix Needed)
**Location**: `src/features/auth/onboarding/components/onboarding-form.tsx`
- User enters full name, birthday (month/day), phone number
- Currently has "Complete Setup" button 
- **Required Change**: Change button text from "Complete Setup" to "Next Step"
- Currently redirects to dashboard (admin vs regular user routing)

### Phase 3 - ❌ NOT IMPLEMENTED
**New Phase**: Partner Account Creation
- Should NOT appear for admin users
- Two-step process for regular users

---

## 🚀 IMPLEMENTATION CHECKLIST

### 📝 **STEP 1: Phase 2 Button Text Fix** ✅ **COMPLETED** (5 minutes)
- [x] **File**: `src/features/auth/onboarding/components/onboarding-form.tsx`
- [x] **Change**: Line ~398 - Update button text from "Complete Setup" to "Next Step"
- [x] **Change**: Line ~398 - Update loading text from "Completing setup..." to "Setting up..."
- [x] **Test**: Verify button text displays correctly

### 🏗️ **STEP 2: Create Phase 3 Component Structure** ✅ **COMPLETED** (30 minutes)
- [x] **Create**: `src/features/auth/partner-setup/` directory
- [x] **Create**: `src/features/auth/partner-setup/index.tsx`
- [x] **Create**: `src/features/auth/partner-setup/components/` directory
- [x] **Create**: `src/features/auth/partner-setup/components/partner-setup-prompt.tsx`
- [x] **Create**: `src/features/auth/partner-setup/components/partner-setup-form.tsx`
- [x] **Create**: `src/features/auth/partner-setup/types.ts`

### 🎯 **STEP 3: Partner Setup Prompt Component** ✅ **COMPLETED** (1 hour)
- [x] **Create**: Partner Setup Prompt Dialog
  - [x] Modal asking "Do you want to create a Partner account now?"
  - [x] Add clear note: "In order to make referrals, you must become a Partner, so this step is necessary before referring people."
  - [x] Two large prominent buttons: "Yes" and "No"
  - [x] "No" redirects to dashboard
  - [x] "Yes" opens partner setup form
- [x] **Implement**: State management for dialog visibility
- [x] **Implement**: Navigation handlers
- [x] **Test**: Dialog opens and closes properly

### 📋 **STEP 4: Partner Setup Form Component** ✅ **COMPLETED** (2 hours)
- [x] **Create**: Zod form schema with validation
  - [x] `is_business: boolean`
  - [x] `business_name: string` (conditional required)
  - [x] `business_address: string` (conditional required)
  - [x] `contact_person_name: string` (conditional required)
  - [x] `contact_person_phone: string` (conditional required)
  - [x] `use_my_details: boolean` (checkbox helper)
- [x] **Implement**: Business toggle switch
  - [x] Label: "Are you a business?"
  - [x] Shows/hides business fields based on state
- [x] **Implement**: Business fields (when switch ON)
  - [x] Business Name (required)
  - [x] Business Address (required)
  - [x] Contact Person Name (required)
  - [x] Contact Person Phone (required)
  - [x] "I am the main contact" checkbox (auto-fills user data)
- [x] **Implement**: Form validation
  - [x] Required field validation when business mode
  - [x] Phone number format validation
  - [x] Email validation
- [x] **Implement**: Auto-fill functionality
  - [x] Pre-fill contact person fields when "I am main contact" checked
  - [x] Use user's name and phone from Phase 2
- [x] **Test**: Form validation works correctly
- [x] **Test**: Auto-fill functionality works

### 🔗 **STEP 5: Database Integration** ✅ **COMPLETED** (1 hour)
- [x] **Implement**: Referrer creation function
  - [x] Insert into `referrers` table
  - [x] Map form fields to database columns:
    - [x] `full_name` ← User's name from Phase 2
    - [x] `email` ← User's email from Phase 1
    - [x] `phone` ← Contact person phone or user's phone
    - [x] `is_business` ← From switch
    - [x] `business_name` ← From form (if business)
    - [x] `contact_person` ← From form (if business)
    - [x] `address` ← Business address (if business)
    - [x] `user_id` ← Current authenticated user ID
    - [x] `active` ← Default true
    - [x] `created_at` ← Current timestamp
- [x] **Implement**: Error handling for database operations
- [x] **Implement**: Success handling and navigation
- [x] **Test**: Database record creation works
- [x] **Test**: Error handling works properly

### 🛣️ **STEP 6: Routing & Flow Control** ✅ **COMPLETED** (45 minutes)
- [x] **Update**: `src/features/auth/onboarding/components/onboarding-form.tsx`
  - [x] Modify success navigation logic
  - [x] Admin users → `/admin` (unchanged)
  - [x] Regular users → `/partner-setup` (new)
- [x] **Create**: `src/routes/(auth)/partner-setup.lazy.tsx`
  - [x] Route definition for partner setup page
  - [x] Import partner setup component
- [x] **Update**: Route generation (if needed)
- [x] **Test**: Navigation flow works correctly
- [x] **Test**: Admin users skip Phase 3
- [x] **Test**: Regular users see Phase 3

### 🎨 **STEP 7: Main Partner Setup Page** ✅ **COMPLETED** (30 minutes)
- [x] **Implement**: `src/features/auth/partner-setup/index.tsx`
  - [x] State management for prompt/form visibility
  - [x] Integration of prompt and form components
  - [x] AuthLayout wrapper
  - [x] Navigation handlers
- [x] **Implement**: Component orchestration
  - [x] Show prompt first
  - [x] Show form when "Yes" clicked
  - [x] Handle completion and redirect
- [x] **Test**: Complete flow works end-to-end

### 🔍 **STEP 8: Error Handling & UX Polish** ✅ **COMPLETED** (1 hour)
- [x] **Implement**: Loading states
  - [x] Form submission loading
  - [x] Button disabled states
  - [x] Loading spinners
- [x] **Implement**: Error handling
  - [x] Network errors
  - [x] Validation errors
  - [x] Database errors
  - [x] User-friendly error messages
- [x] **Implement**: Success feedback
  - [x] Success messages
  - [x] Smooth transitions
  - [x] Proper redirects
- [x] **Test**: All error scenarios
- [x] **Test**: Loading states work properly

### 🧪 **STEP 9: Comprehensive Testing** ✅ **COMPLETED** (1 hour)
- [x] **Test**: Admin user flow (skips Phase 3)
- [x] **Test**: Regular user - Skip option (chooses "No")
- [x] **Test**: Regular user - Individual setup (business OFF)
- [x] **Test**: Regular user - Business setup (business ON)
- [x] **Test**: Regular user - Self contact checkbox
- [x] **Test**: Form validation (all scenarios)
- [x] **Test**: Database integration
- [x] **Test**: Navigation flow
- [x] **Test**: Edge cases:
  - [x] Page refresh during process
  - [x] Back navigation
  - [x] Network timeouts
  - [x] Duplicate email handling

### 🎯 **STEP 10: Final Polish & Documentation** ✅ **COMPLETED** (30 minutes)
- [x] **Review**: Code quality and consistency
- [x] **Review**: UI/UX consistency with existing design
- [x] **Review**: Error messages and user feedback
- [x] **Update**: This checklist with any additional notes
- [x] **Test**: Final end-to-end user journey
- [x] **Deploy**: Ready for production

### 🎨 **BONUS: Beautiful Background Images** ✅ **COMPLETED**
- [x] **Add**: Responsive background images to AuthLayout
- [x] **Mobile**: ColellaPartners_Background_Mobile.png
- [x] **Desktop/Tablet**: ColellaPartners_Background_DesktopTablet.png
- [x] **Enhancement**: Added subtle overlay for better readability
- [x] **Enhancement**: Added drop-shadow to logo for better visibility

---

## 🎯 **SUCCESS CRITERIA**

### Phase 1 ✅
- [x] User can enter email, password, and permissions
- [x] Validation works correctly
- [x] Redirects to Phase 2

### Phase 2 ✅ **COMPLETED**
- [x] User can enter name, birthday, phone
- [x] Button shows "Next Step" instead of "Complete Setup"
- [x] Redirects to Phase 3 for regular users
- [x] Redirects to admin dashboard for admin users

### Phase 3 ✅ **COMPLETED**
- [x] Admin users skip this phase completely
- [x] Regular users see partner account prompt
- [x] "No" option redirects to dashboard
- [x] "Yes" option shows partner setup form
- [x] Form handles individual vs business setup
- [x] Data saves correctly to referrers table
- [x] Success redirects to dashboard

---

## 📊 **Implementation Timeline**

**Total Estimated Time**: 7-8 hours
- Step 1: 5 minutes ⚡
- Step 2: 30 minutes
- Step 3: 1 hour
- Step 4: 2 hours
- Step 5: 1 hour
- Step 6: 45 minutes
- Step 7: 30 minutes
- Step 8: 1 hour
- Step 9: 1 hour
- Step 10: 30 minutes

---

## 📋 **Technical Requirements**

### Required Components (All Available ✅)
- [x] Dialog - For modals
- [x] Button - For action buttons
- [x] Switch - For business toggle
- [x] Input - For text fields
- [x] Form - For form handling
- [x] Checkbox - For "I am the main contact"
- [x] Card - For layout

### Database Schema
```sql
referrers table:
- id (UUID, PK)
- full_name (TEXT, required)
- email (TEXT, required)
- phone (TEXT)
- is_business (BOOLEAN, default false)
- business_name (TEXT)
- contact_person (TEXT)
- address (TEXT)
- user_id (UUID, FK to auth.users)
- active (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

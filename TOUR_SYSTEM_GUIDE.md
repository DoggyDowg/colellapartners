# 🚀 App Orientation System

This guide explains the new orientation system that helps first-time users get familiar with your referral dashboard app.

## 📋 What's Included

The orientation system consists of several components working together:

### 1. **Interactive Tour** (`AppTour`)
- Step-by-step guided tour using React Joyride
- Highlights specific UI elements with explanations
- Smooth transitions between steps
- Skip/restart functionality

### 2. **Welcome Banner** (`WelcomeBanner`)
- Appears for first-time users
- Attractive introduction to the app
- Quick way to start the tour
- Can be dismissed if user isn't ready

### 3. **Onboarding Checklist** (`OnboardingChecklist`)
- Progressive task list for new users
- Tracks completion status automatically
- Links to relevant sections
- Shows progress with visual indicators

### 4. **Help System** (`HelpTooltip` & `HelpButton`)
- Contextual help tooltips throughout the app
- Quick access to restart tour
- Contact support options
- Can be enabled/disabled by user

### 5. **State Management** (`useTourStore`)
- Persists tour progress across sessions
- Tracks user preferences
- Manages tour state and steps

## 🎯 Tour Steps

The tour covers these key areas:

1. **Welcome** - Introduction and overview
2. **Dashboard Stats** - Understanding your metrics
3. **Quick Actions** - How to access common tasks
4. **Referrals Section** - Managing your referrals
5. **Rewards** - Understanding the reward system
6. **Navigation** - Using the sidebar menu
7. **Profile** - Managing account settings
8. **Help System** - Getting support

## 🔧 How It Works

### First-Time User Experience
1. User completes profile setup (existing flow)
2. Welcome banner appears on dashboard
3. User can start tour immediately or dismiss for later
4. Onboarding checklist shows remaining tasks
5. Tour can be restarted anytime from help menu

### Tour Triggers
- **Automatic**: Shows for users who haven't seen welcome or completed tour
- **Manual**: Can be restarted via Help button (❓ icon in header)
- **Help Center**: Available from settings/help area

### Data Attributes Used
The tour system uses `data-tour` attributes to target elements:

```html
<!-- Dashboard stats section -->
<div data-tour="dashboard-stats">...</div>

<!-- Quick actions area -->
<div data-tour="quick-actions">...</div>

<!-- Referrals card -->
<div data-tour="referrals-card">...</div>

<!-- Rewards section -->
<div data-tour="rewards-card">...</div>

<!-- Sidebar navigation -->
<div data-tour="sidebar-nav">...</div>

<!-- Profile dropdown -->
<div data-tour="profile-dropdown">...</div>

<!-- Help button -->
<button data-tour="help-button">...</button>
```

## 🎨 Components Added

### New Files Created:
- `src/stores/tourStore.ts` - Tour state management
- `src/components/tour/AppTour.tsx` - Main tour component
- `src/components/tour/WelcomeBanner.tsx` - Welcome banner
- `src/components/tour/OnboardingChecklist.tsx` - Task checklist
- `src/components/tour/HelpTooltip.tsx` - Contextual help
- `src/components/tour/HelpButton.tsx` - Help dropdown menu

### Modified Files:
- `src/routes/_authenticated/index.tsx` - Added tour components to dashboard
- `src/components/layout/header.tsx` - Added help button and tour attributes
- `src/components/layout/app-sidebar.tsx` - Added tour attributes

## 🛠 Customization

### Adding New Tour Steps
To add new tour steps, update the `defaultTourSteps` array in `src/stores/tourStore.ts`:

```typescript
{
  id: 'new-step',
  title: '📊 New Feature',
  content: 'Explanation of the new feature...',
  target: '[data-tour="new-feature"]',
  placement: 'bottom',
}
```

### Adding Help Tooltips
Create new tooltips in components:

```tsx
import { HelpTooltip } from '@/components/tour/HelpTooltip'

<HelpTooltip
  title="Feature Name"
  content="Helpful explanation here"
/>
```

### Customizing Checklist Items
Update the checklist logic in `OnboardingChecklist.tsx` to add new tasks or change completion criteria.

## 📱 Responsive Design

The tour system is fully responsive:
- **Mobile**: Simplified tour steps, larger touch targets
- **Tablet**: Adapted positioning and content
- **Desktop**: Full feature set with optimal positioning

## 🔐 User Preferences

Users can control their experience:
- **Tour Completion**: Tracked automatically
- **Help Tooltips**: Can be toggled on/off
- **Welcome Banner**: Shows only once unless reset
- **Tour Progress**: Persisted across sessions

## 🎯 Best Practices

1. **Keep tour steps concise** - 2-3 short sentences max
2. **Use emojis sparingly** - Only for visual emphasis
3. **Test on all devices** - Ensure responsive behavior
4. **Update tour content** - When features change
5. **Monitor completion rates** - Track user engagement

## 🚀 Getting Started

The orientation system is now active! New users will automatically see:

1. Welcome banner on their first dashboard visit
2. Onboarding checklist showing remaining tasks
3. Option to start the interactive tour
4. Help system available throughout the app

Existing users can restart the tour anytime using the help button (❓) in the header.

## 📊 Tracking & Analytics

Consider adding analytics to track:
- Tour completion rates
- Step drop-off points
- Time spent on each step
- Help tooltip usage
- User feedback on tour effectiveness

This data can help improve the onboarding experience over time.

---

**Questions or need help?** The tour system is designed to be self-explanatory, but feel free to reach out if you need assistance customizing it for your specific needs! 
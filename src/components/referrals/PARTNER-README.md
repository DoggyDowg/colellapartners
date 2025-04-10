# Partner Referral Form Component

This component provides a dialog-based form specifically for **partners** to submit client referrals. A separate form will be available for admin use.

## Features

- Partner-friendly modal dialog form that can be triggered from anywhere in the UI
- Form validation using Zod schema
- Collects all required and optional referral information from partner perspective
- Customizable success callback function

## Database Structure

The partner referral form submits to the following database schema:

| Field                | Type      | Required | Description                               |
|----------------------|-----------|----------|-------------------------------------------|
| referee_name         | text      | Yes      | Name of the person being referred         |
| referee_phone        | text      | No       | Phone number of the referral              |
| referee_email        | text      | No       | Email address of the referral             |
| referee_type         | enum      | Yes      | Type of referral ('seller' or 'landlord') |
| situation_description| text      | No       | Description of the referral's situation   |
| additional_notes     | text      | No       | Any additional notes about the referral   |
| property_address     | text      | No       | Address of the property (if applicable)   |
| contact_consent      | boolean   | No       | Whether the referral consented to contact |
| status               | text      | Yes      | Status of the referral (default: "New")   |

## Usage

```tsx
import { PartnerReferralForm } from '@/components/referrals/PartnerReferralForm';

export default function PartnerPortalPage() {
  const handleSuccess = () => {
    // Do something after successful submission
    console.log('Partner referral submitted successfully');
  };

  return (
    <div>
      <h1>Partner Portal</h1>
      <PartnerReferralForm onSubmitSuccess={handleSuccess} />
    </div>
  );
}
```

## Props

| Prop             | Type       | Required | Description                            |
|------------------|------------|----------|----------------------------------------|
| onSubmitSuccess  | () => void | No       | Callback function on successful submit |

## Implementation Notes

- The form is designed specifically for partner users, not admin users
- Uses the Dialog component from our UI library
- Validation is handled using Zod schema
- The form is reset after successful submission
- The dialog automatically closes on successful submission

## Example

See `PartnerReferralFormExample.tsx` for a complete usage example. 
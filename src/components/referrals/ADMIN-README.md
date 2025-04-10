# Admin Referral Form Component

This component provides a dialog-based form specifically for **admin users** to submit referrals on behalf of partners.

## Features

- Admin-friendly modal dialog form that can be triggered from anywhere in the UI
- Form validation using Zod schema
- Two-step process to first identify the referrer:
  1. Lookup referrer by email with auto-fill if found
  2. Create/edit referrer details if needed
- Referrer section with fields for:
  - Partner/referrer email (required)
  - Partner/referrer name (required)
  - Partner/referrer phone
  - Business/Individual selection
  - Business-specific fields (name, partner code, contact person)
- Partner code validation (uniqueness check with visual indicators)
- Referral detail section with same fields as partner form
- Customizable success callback function

## Database Structure

The admin referral form interacts with the following database tables:

### Referrers Table
| Field              | Type      | Required | Description                             |
|--------------------|-----------|----------|-----------------------------------------|
| id                 | uuid      | Yes      | Primary key for the referrer            |
| full_name          | text      | Yes      | Full name of the referrer               |
| email              | text      | Yes      | Email address of the referrer           |
| phone              | text      | No       | Phone number of the referrer            |
| is_business        | boolean   | No       | Whether the referrer is a business      |
| business_name      | text      | No       | Name of the business (if applicable)    |
| partner_code       | text      | No       | Unique code for the business partner    |
| contact_person     | text      | No       | Contact person for the business         |
| created_at         | timestamp | Yes      | When the referrer was created           |
| active             | boolean   | No       | Whether the referrer is active          |

### Referrals Table
| Field                | Type      | Required | Description                               |
|----------------------|-----------|----------|-------------------------------------------|
| id                   | uuid      | Yes      | Primary key for the referral              |
| referrer_id          | uuid      | Yes      | Foreign key to the referrers table        |
| referee_name         | text      | Yes      | Name of the person being referred         |
| referee_phone        | text      | No       | Phone number of the referral              |
| referee_email        | text      | No       | Email address of the referral             |
| referee_type         | enum      | Yes      | Type of referral ('seller' or 'landlord') |
| situation_description| text      | No       | Description of the referral's situation   |
| additional_notes     | text      | No       | Any additional notes about the referral   |
| contact_consent      | boolean   | No       | Whether the referral consented to contact |
| status               | text      | Yes      | Status of the referral (default: "New")   |
| created_at           | timestamp | Yes      | When the referral was created             |

## Usage

```tsx
import { AdminReferralForm } from '@/components/referrals/AdminReferralForm';

export default function AdminPortalPage() {
  const handleSuccess = () => {
    // Do something after successful submission
    console.log('Admin referral submitted successfully');
  };

  return (
    <div>
      <h1>Admin Portal</h1>
      <AdminReferralForm onSubmitSuccess={handleSuccess} />
    </div>
  );
}
```

## Props

| Prop             | Type       | Required | Description                            |
|------------------|------------|----------|----------------------------------------|
| onSubmitSuccess  | () => void | No       | Callback function on successful submit |

## Implementation Notes

- The form is designed specifically for admin users, not partner users
- Uses the Dialog component from our UI library
- Two-section form (referrer + referral details)
- Validation is handled using Zod schema 
- Business partner fields are conditionally displayed
- Partner code uniqueness is checked as the user types
- The form resets after successful submission
- The dialog automatically closes on successful submission 
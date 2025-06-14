export interface PartnerSetupFormData {
  is_business: boolean
  business_name?: string
  business_address?: string
  contact_person_name?: string
  contact_person_phone?: string
  use_my_details?: boolean
}

export interface ReferrerData {
  id?: string
  full_name: string
  email: string
  phone?: string
  is_business: boolean
  business_name?: string
  contact_person?: string
  address?: string
  user_id: string
  active?: boolean
  created_at?: string
} 
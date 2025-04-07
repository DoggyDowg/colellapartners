import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'

export default function SettingsProfile() {
  return (
    <ContentSection
      title='Profile & Account'
      desc='Manage your personal information and account settings.'
    >
      <ProfileForm />
    </ContentSection>
  )
}

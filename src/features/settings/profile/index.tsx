import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'
import { PasswordForm } from '../communications/password-form'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsProfile() {
  const { user } = useAuth()
  
  const isEmailPasswordUser = user?.app_metadata?.provider === 'email'

  return (
    <ContentSection
      title='Profile & Account'
      desc='Manage your personal information and account settings.'
    >
      <ProfileForm />
      
      {isEmailPasswordUser && (
        <>
          <Separator className="my-6" />
          <PasswordForm />
        </>
      )}
    </ContentSection>
  )
}

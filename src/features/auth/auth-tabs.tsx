import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AuthLayout from './auth-layout'
import { UserAuthForm } from './sign-in/components/user-auth-form'
import { SignUpForm } from './sign-up/components/sign-up-form'

interface AuthTabsProps {
  defaultTab?: 'login' | 'register'
}

export default function AuthTabs({ defaultTab = 'login' }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  
  return (
    <AuthLayout>
      <Card className='p-6'>
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className='flex flex-col space-y-2 text-left mb-4'>
              <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
              <p className='text-sm text-muted-foreground'>
                Enter your email and password below to log into your account
              </p>
            </div>
            <UserAuthForm />
          </TabsContent>
          
          <TabsContent value="register">
            <div className='mb-2 flex flex-col space-y-2 text-left'>
              <h1 className='text-lg font-semibold tracking-tight'>
                Create an account
              </h1>
            </div>
            <SignUpForm />
          </TabsContent>
        </Tabs>
        
        <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
          By {activeTab === 'login' ? 'logging in' : 'creating an account'}, you agree to our{' '}
          <a
            href='https://colella.com.au/privacy-policy'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-4 hover:text-primary'
          >
            Privacy Policy
          </a>
          .
        </p>
      </Card>
    </AuthLayout>
  )
} 
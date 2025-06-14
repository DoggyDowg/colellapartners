interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className='relative min-h-svh w-full'>
      {/* Background Images - Responsive & Fixed */}
      <div className='fixed inset-0 z-0'>
        {/* Mobile Background */}
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed lg:hidden'
          style={{
            backgroundImage: "url('/images/backgrounds/ColellaPartners_Background_Mobile.png')"
          }}
        />
        
        {/* Desktop/Tablet Background */}
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed hidden lg:block'
          style={{
            backgroundImage: "url('/images/backgrounds/ColellaPartners_Background_DesktopTablet.png')"
          }}
        />
        
        {/* Optional overlay for better text readability */}
        <div className='absolute inset-0 bg-black/10' />
      </div>
      
      {/* Scrollable Content */}
      <div className='relative z-10 min-h-svh overflow-y-auto'>
        <div className='container flex flex-col items-center justify-center min-h-svh py-8 lg:max-w-none lg:px-0'>
          <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
            <div className='mb-4 flex items-center justify-center'>
              <img
                src='/images/custom/colellapartners_logo_landscape.png'
                alt='Colella Partners Logo'
                className='h-9 w-auto mr-2 drop-shadow-sm'
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

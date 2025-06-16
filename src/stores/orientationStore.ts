import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface OrientationSlide {
  id: string
  title: string
  content: string
  video?: string
  nextButtonText: string
  showForRoles: ('user' | 'partner')[]
  showCondition?: (userRole: string) => boolean
}

interface OrientationState {
  // Current orientation state
  isActive: boolean
  currentSlide: number
  userRole: 'user' | 'partner' | null
  
  // Completion tracking
  hasSeenOrientation: boolean
  hasCompletedOrientation: boolean
  
  // Actions
  startOrientation: (userRole?: 'user' | 'partner') => void
  endOrientation: () => void
  nextSlide: () => void
  previousSlide: () => void
  goToSlide: (slideIndex: number) => void
  skipOrientation: () => void
  resetOrientation: () => void
  setUserRole: (role: 'user' | 'partner') => void
}

const orientationSlides: OrientationSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Colella Partners!',
    content: `Welcome to Colella Partners! This app is designed to help you earn great referral rewards by connecting clients with our expert real estate services.

You'll discover how easy it is to:
• Refer clients and track their progress
• Access professional referral tools
• Monitor your earnings in real-time
• Build a rewarding referral business`,
    video: '/videos/orientation/desktop/welcome.mp4',
    nextButtonText: 'Get Started',
    showForRoles: ['user', 'partner'],
  },
  {
    id: 'get-started-referring',
    title: 'Start Referring Now',
    content: `Ready to make your first referral? It's easy! Use the "Refer Someone Now" button in the header to get started.

You'll simply fill out:
• Your referral's contact information
• The type of property service they need
• Any additional details that might help

Each referral is tracked automatically so you can monitor progress and earnings.`,
    video: '/videos/orientation/desktop/get-started-referring.mp4',
    nextButtonText: 'Explore Your Toolkit',
    showForRoles: ['user', 'partner'],
  },
  {
    id: 'referral-toolkit',
    title: 'Your Referral Toolkit',
    content: `Access powerful tools to boost your referral success! Your toolkit includes:

• **Unique Referral Code**: Your personal tracking code
• **Custom Referral URL**: Share-ready link to track referrals
• **QR Code Generator**: Perfect for business cards and flyers
• **Marketing Materials**: Professional brochures and promotional content

Everything you need to promote your referral business professionally.`,
    video: '/videos/orientation/desktop/referral-toolkit.mp4',
    nextButtonText: 'Track Your Referrals',
    showForRoles: ['user', 'partner'],
  },
  {
    id: 'my-referrals',
    title: 'Track Your Referrals',
    content: `Stay on top of all your referrals with real-time tracking:

• **Live Status Updates**: See exactly where each referral stands
• **Progress Monitoring**: Track from initial contact to settlement
• **Communication History**: View all interactions and updates
• **Earnings Projections**: See potential rewards for each referral

You'll always know how your referral business is performing.`,
    video: '/videos/orientation/desktop/my-referrals.mp4',
    nextButtonText: 'See Your Rewards',
    showForRoles: ['user', 'partner'],
  },
  {
    id: 'my-rewards',
    title: 'Your Earning Potential',
    content: `Track your financial success with our comprehensive rewards system:

• **Real-Time Earnings**: See exactly what you've earned
• **Future Projections**: View upcoming reward payments
• **Performance Analytics**: Understand your referral success rate
• **Payment History**: Complete record of all rewards received

Watch your referral business grow and see the financial impact of your efforts.`,
    video: '/videos/orientation/desktop/my-rewards.mp4',
    nextButtonText: "Let's Get Started!",
    showForRoles: ['user', 'partner'],
  },
  {
    id: 'final-welcome',
    title: "You're All Set!",
    content: `Congratulations! You now know how to use all the key features of your Colella Partners referral dashboard.

You're ready to:
• Start referring clients right away
• Use professional tools to promote your business
• Track your success and earnings
• Build a rewarding referral business

Remember, you can restart this orientation anytime from the "Other" section in your sidebar menu.

**Ready to start earning some great referral rewards?**`,
    nextButtonText: 'Start Earning Rewards',
    showForRoles: ['user', 'partner'],
  },
]

export const useOrientationStore = create<OrientationState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      currentSlide: 0,
      userRole: null,
      hasSeenOrientation: false,
      hasCompletedOrientation: false,

      // Actions
      startOrientation: (userRole) => {
        const role = userRole || get().userRole || 'partner' // Default to partner if no role is set
        set({
          isActive: true,
          currentSlide: 0,
          userRole: role,
        })
      },

      endOrientation: () => {
        set({
          isActive: false,
          hasCompletedOrientation: true,
          hasSeenOrientation: true,
        })
      },

      nextSlide: () => {
        const { currentSlide, userRole } = get()
        const validSlides = orientationSlides.filter(slide => 
          slide.showForRoles.includes(userRole as 'user' | 'partner') &&
          (!slide.showCondition || slide.showCondition(userRole as string))
        )
        
        if (currentSlide < validSlides.length - 1) {
          // Find the next valid slide index in the full slides array
          const currentSlideId = validSlides[currentSlide].id
          const currentIndex = orientationSlides.findIndex(slide => slide.id === currentSlideId)
          
          for (let i = currentIndex + 1; i < orientationSlides.length; i++) {
            const slide = orientationSlides[i]
            if (slide.showForRoles.includes(userRole as 'user' | 'partner') &&
                (!slide.showCondition || slide.showCondition(userRole as string))) {
              set({ currentSlide: currentSlide + 1 })
              return
            }
          }
        } else {
          get().endOrientation()
        }
      },

      previousSlide: () => {
        const { currentSlide } = get()
        if (currentSlide > 0) {
          set({ currentSlide: currentSlide - 1 })
        }
      },

      goToSlide: (slideIndex: number) => {
        const { userRole } = get()
        const validSlides = orientationSlides.filter(slide =>
          slide.showForRoles.includes(userRole as 'user' | 'partner') &&
          (!slide.showCondition || slide.showCondition(userRole as string))
        )
        
        if (slideIndex >= 0 && slideIndex < validSlides.length) {
          set({ currentSlide: slideIndex })
        }
      },

      skipOrientation: () => {
        set({
          isActive: false,
          hasCompletedOrientation: true,
          hasSeenOrientation: true,
        })
      },

      resetOrientation: () => {
        set({
          isActive: false,
          currentSlide: 0,
          hasSeenOrientation: false,
          hasCompletedOrientation: false,
        })
      },

      setUserRole: (role: 'user' | 'partner') => {
        set({ userRole: role })
      },
    }),
    {
      name: 'orientation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenOrientation: state.hasSeenOrientation,
        hasCompletedOrientation: state.hasCompletedOrientation,
        userRole: state.userRole,
      }),
    }
  )
)

// Helper function to get valid slides for a user role
export const getValidSlidesForRole = (userRole: 'user' | 'partner') => {
  return orientationSlides.filter(slide =>
    slide.showForRoles.includes(userRole) &&
    (!slide.showCondition || slide.showCondition(userRole))
  )
} 
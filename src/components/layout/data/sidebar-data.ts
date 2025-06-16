import {
  IconHelp,
  IconLayoutDashboard,
  IconPalette,
  IconSettings,
  IconTicket,
  IconUserPlus,
  IconGift,
  IconCalendarEvent,
  IconClock,
  IconTrophy,
  IconUserCircle,
  IconHome,
  IconNews,
  IconMail,
  IconBell,
  IconInfoCircle,
  IconFileText,
} from '@tabler/icons-react'
import { AudioWaveform, GalleryVerticalEnd, SquareUser, Wrench } from 'lucide-react'
import { type SidebarData } from '../types'
import { ColellaSiteIcon } from '../ColellaSiteIcon'

// We'll handle the notification indicator in a different way since we can't use JSX in a .ts file
export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@colellapartners.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Colella Partners',
      logo: ColellaSiteIcon,
      plan: 'Real Estate Referrals',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Admin',
      items: [
        {
          title: 'Admin Dashboard',
          url: '/admin',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Referrals',
          url: '/admin/referrals',
          icon: IconTicket,
        },
        {
          title: 'Partners',
          url: '/admin/referrers',
          icon: IconUserPlus,
        },
        {
          title: 'Rewards',
          url: '/admin/rewards',
          icon: IconGift,
        },
        {
          title: 'Events',
          url: '/admin/events',
          icon: IconCalendarEvent,
          disabled: true,
          tooltip: "Coming Soon",
          rightIcon: IconClock,
        },
        {
          title: 'Raffles',
          url: '/admin/raffles',
          icon: IconTicket,
          disabled: true,
          tooltip: "Coming Soon",
          rightIcon: IconClock,
        },
      ],
    },
    {
      title: 'Partner Hub',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'For Sale',
          url: '/for-sale',
          icon: IconHome,
        },
        {
          title: 'Latest News',
          url: '/latest-news',
          icon: IconNews,
        },
        {
          title: 'My Rewards',
          url: '/rewards',
          icon: IconGift,
        },
        {
          title: 'My Referrals',
          url: '/referrals',
          icon: IconUserCircle,
        },
        {
          title: 'Referral Toolkit',
          url: '/referral-toolkit',
          icon: Wrench,
        },
        {
          title: 'Achievements',
          url: '/achievements',
          icon: IconTrophy,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Notifications',
          url: '/notifications',
          icon: IconBell,
        },
        {
          title: 'Program Details',
          url: 'https://www.colellapartners.com.au/program-details',
          icon: IconInfoCircle,
          external: true,
        },
        {
          title: 'Terms & Conditions',
          url: 'https://www.colellapartners.com.au/terms-and-conditions',
          icon: IconFileText,
          external: true,
        },
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: SquareUser,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Communications',
              url: '/settings/communications',
              icon: IconMail,
            },
          ],
        },
        {
          title: 'Take a Tour',
          url: '#take-tour',
          icon: IconHelp,
          onClick: () => {
            // This will be handled in the nav group component
            const event = new CustomEvent('orientation:start')
            window.dispatchEvent(event)
          },
        },
      ],
    },
  ],
}

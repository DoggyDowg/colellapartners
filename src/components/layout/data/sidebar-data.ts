import {
  IconHelp,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconSettings,
  IconUserCog,
  IconTicket,
  IconUserPlus,
  IconGift,
  IconCalendarEvent,
  IconClock,
  IconTrophy,
  IconUserCircle,
  IconBuilding,
} from '@tabler/icons-react'
import { AudioWaveform, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'
import { ColellaSiteIcon } from '../ColellaSiteIcon'

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
          icon: IconBuilding,
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
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}

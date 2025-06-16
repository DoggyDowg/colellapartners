// Role-based permission utilities

export type UserRole = 'user' | 'partner' | 'manager' | 'admin'

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  user: {
    canCreateProfile: true,
    canViewDashboard: false,
    canCreateReferrals: false,
    canViewReferrals: false,
    canAccessPartnerTools: false,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  partner: {
    canCreateProfile: true,
    canViewDashboard: true,
    canCreateReferrals: true,
    canViewReferrals: true,
    canAccessPartnerTools: true,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  manager: {
    canCreateProfile: true,
    canViewDashboard: true,
    canCreateReferrals: true,
    canViewReferrals: true,
    canAccessPartnerTools: true,
    canManageUsers: true,
    canAccessAdmin: false,
  },
  admin: {
    canCreateProfile: true,
    canViewDashboard: true,
    canCreateReferrals: true,
    canViewReferrals: true,
    canAccessPartnerTools: true,
    canManageUsers: true,
    canAccessAdmin: true,
  },
} as const

// Helper function to check if a user has a specific permission
export function hasPermission(userRole: UserRole | null, permission: keyof typeof ROLE_PERMISSIONS.user): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

// Helper function to check if user can access a specific route
export function canAccessRoute(userRole: UserRole | null, route: string): boolean {
  if (!userRole) return false

  // Define route access patterns
  const routePermissions: Record<string, keyof typeof ROLE_PERMISSIONS.user> = {
    '/dashboard': 'canViewDashboard',
    '/referrals': 'canViewReferrals',
    '/partner-tools': 'canAccessPartnerTools',
    '/admin': 'canAccessAdmin',
    '/users': 'canManageUsers',
  }

  // Check if route matches any pattern
  for (const [routePattern, permission] of Object.entries(routePermissions)) {
    if (route.startsWith(routePattern)) {
      return hasPermission(userRole, permission)
    }
  }

  // Default: allow access to public routes
  return true
}

// Helper function to get redirect path based on user role
export function getDefaultRedirectForRole(userRole: UserRole | null): string {
  switch (userRole) {
    case 'admin':
      return '/admin'
    case 'manager':
      return '/dashboard'
    case 'partner':
      return '/dashboard'
    case 'user':
      return '/onboarding' // Redirect users to partner signup
    default:
      return '/auth'
  }
}

// Check if user should see partner onboarding
export function shouldShowPartnerOnboarding(userRole: UserRole | null, hasCompletedPartnerSetup: boolean | null): boolean {
  // Show partner onboarding if:
  // 1. User has 'user' role (hasn't become partner yet)
  // 2. Has not completed partner setup
  return userRole === 'user' && hasCompletedPartnerSetup === false
}

// Role hierarchy for comparison (higher number = higher privilege)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  partner: 2,
  manager: 3,
  admin: 4,
}

// Check if userRole1 has higher or equal privilege than userRole2
export function hasHigherOrEqualRole(userRole1: UserRole | null, userRole2: UserRole): boolean {
  if (!userRole1) return false
  return ROLE_HIERARCHY[userRole1] >= ROLE_HIERARCHY[userRole2]
}

// Check if user role is at least the minimum required role
export function hasMinimumRole(userRole: UserRole | null, minimumRole: UserRole): boolean {
  return hasHigherOrEqualRole(userRole, minimumRole)
} 
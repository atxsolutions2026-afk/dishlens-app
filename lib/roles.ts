// lib/roles.ts - Helper functions for role checking

export function isPlatformRole(role: string): boolean {
  return [
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'SUPPORT_AGENT',
    'SALES',
    'ONBOARDING',
    'ATX_ADMIN', // Legacy compatibility
  ].includes(role);
}

export function isRestaurantRole(role: string): boolean {
  return !isPlatformRole(role);
}

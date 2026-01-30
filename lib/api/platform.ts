/**
 * Platform (ATX IT Solutions) API endpoints
 * These endpoints require platform user authentication (SUPER_ADMIN, COMPANY_ADMIN, etc.)
 */

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { getToken } from "@/lib/auth";

const API_BASE = apiBaseUrl();

export interface PlatformRestaurant {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  subscriptionPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantFeatures {
  orderingEnabled: boolean;
  waiterCallEnabled: boolean;
  dishRatingsEnabled: boolean;
  waiterRatingsEnabled: boolean;
  spiceLevelRequired: boolean;
  allergenNotesRequired: boolean;
  specialInstructionsEnabled: boolean;
  etaVisible: boolean;
  availabilityVisible: boolean;
  kitchenScreenEnabled: boolean;
  paymentEnabled: boolean;
  tableReservationEnabled: boolean;
}

export interface RestaurantBranding {
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string | null;
  fontFamily: string;
  customDomain?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number | string; // Can be string from decimal type in DB
  priceYearly?: number | string | null;
  description?: string | null;
  active: boolean;
}

export interface PlatformRestaurantDetail extends PlatformRestaurant {
  features: RestaurantFeatures;
  branding: RestaurantBranding;
}

export interface CreateRestaurantDto {
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  subscriptionPlanCode?: string;
  createAdminUser?: {
    email: string;
    name: string;
    password: string;
  };
}

/**
 * Platform login (uses same auth endpoint, but platform users have platform roles).
 */
export async function platformLogin(email: string, password: string) {
  return apiFetch<{
    accessToken: string;
    expiresIn: string;
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      isActive: boolean;
    };
  }>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * List all restaurants (platform view).
 */
export async function listPlatformRestaurants(status?: string): Promise<PlatformRestaurant[]> {
  const token = getToken();
  const url = status
    ? `${API_BASE}/platform/restaurants?status=${status}`
    : `${API_BASE}/platform/restaurants`;
  return apiFetch<PlatformRestaurant[]>(url, {
    method: "GET",
    token,
  });
}

/**
 * Get restaurant details (platform view).
 */
export async function getPlatformRestaurant(id: string): Promise<PlatformRestaurantDetail> {
  const token = getToken();
  return apiFetch<PlatformRestaurantDetail>(`${API_BASE}/platform/restaurants/${id}`, {
    method: "GET",
    token,
  });
}

/**
 * Create restaurant (onboarding).
 */
export async function createPlatformRestaurant(dto: CreateRestaurantDto): Promise<PlatformRestaurant> {
  const token = getToken();
  return apiFetch<PlatformRestaurant>(`${API_BASE}/platform/restaurants`, {
    method: "POST",
    body: JSON.stringify(dto),
    token,
  });
}

/**
 * Update restaurant.
 */
export async function updatePlatformRestaurant(
  id: string,
  updates: {
    name?: string;
    slug?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
    subscriptionPlanCode?: string;
  },
): Promise<PlatformRestaurant> {
  const token = getToken();
  return apiFetch<PlatformRestaurant>(`${API_BASE}/platform/restaurants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
    token,
  });
}

/**
 * Suspend restaurant.
 */
export async function suspendRestaurant(id: string): Promise<PlatformRestaurant> {
  const token = getToken();
  return apiFetch<PlatformRestaurant>(`${API_BASE}/platform/restaurants/${id}/suspend`, {
    method: "POST",
    token,
  });
}

/**
 * Activate restaurant.
 */
export async function activateRestaurant(id: string): Promise<PlatformRestaurant> {
  const token = getToken();
  return apiFetch<PlatformRestaurant>(`${API_BASE}/platform/restaurants/${id}/activate`, {
    method: "POST",
    token,
  });
}

/**
 * Update restaurant features.
 */
export async function updateRestaurantFeatures(
  id: string,
  features: Partial<RestaurantFeatures>,
): Promise<RestaurantFeatures> {
  const token = getToken();
  return apiFetch<RestaurantFeatures>(`${API_BASE}/platform/restaurants/${id}/features`, {
    method: "PATCH",
    body: JSON.stringify(features),
    token,
  });
}

/**
 * Update restaurant branding.
 */
export async function updateRestaurantBranding(
  id: string,
  branding: Partial<RestaurantBranding>,
): Promise<RestaurantBranding> {
  const token = getToken();
  return apiFetch<RestaurantBranding>(`${API_BASE}/platform/restaurants/${id}/branding`, {
    method: "PATCH",
    body: JSON.stringify(branding),
    token,
  });
}

/**
 * List subscription plans.
 */
export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const token = getToken();
  return apiFetch<SubscriptionPlan[]>(`${API_BASE}/platform/plans`, {
    method: "GET",
    token,
  });
}

export interface AuditLog {
  id: string;
  actorPlatformUserId?: string | null;
  targetRestaurantId?: string | null;
  actionType: string;
  actionDetails?: Record<string, any> | null;
  beforeJson?: Record<string, any> | null;
  afterJson?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  restaurantId?: string;
  actionType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get audit logs.
 */
export async function getAuditLogs(filters?: AuditLogFilters): Promise<{ logs: AuditLog[]; total: number }> {
  const token = getToken();
  const qs = new URLSearchParams();
  if (filters?.restaurantId) qs.append('restaurantId', filters.restaurantId);
  if (filters?.actionType) qs.append('actionType', filters.actionType);
  if (filters?.limit) qs.append('limit', String(filters.limit));
  if (filters?.offset) qs.append('offset', String(filters.offset));
  
  const url = `${API_BASE}/platform/audit-logs${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiFetch<{ logs: AuditLog[]; total: number }>(url, {
    method: "GET",
    token,
  });
}

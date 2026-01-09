export function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  return base.replace(/\/$/, "");
}
export function restaurantSlug() {
  return process.env.NEXT_PUBLIC_RESTAURANT_SLUG || "demo-restaurant";
}

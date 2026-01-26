/**
 * Get the API base URL.
 * Supports both NEXT_PUBLIC_API_BASE and NEXT_PUBLIC_API_BASE_URL for backward compatibility.
 * Prefers NEXT_PUBLIC_API_BASE if both are set.
 * 
 * Always returns a valid URL with http:// or https:// protocol.
 */
export function apiBaseUrl(): string {
  const base = 
    process.env.NEXT_PUBLIC_API_BASE || 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    "http://localhost:3000";
  
  // Remove trailing slash
  let url = base.replace(/\/$/, "");
  
  // Ensure URL has a protocol (http:// or https://)
  if (!url.match(/^https?:\/\//i)) {
    // If no protocol, assume http:// for localhost, https:// otherwise
    if (url.includes("localhost") || url.startsWith("127.0.0.1") || url.startsWith(":")) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    console.error(`Invalid API base URL: ${base}. Falling back to http://localhost:3000`);
    return "http://localhost:3000";
  }
  
  return url;
}

export function restaurantSlug() {
  return process.env.NEXT_PUBLIC_RESTAURANT_SLUG || "demo-restaurant";
}

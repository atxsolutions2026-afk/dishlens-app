export async function apiFetch<T>(
  url: string,
  opts?: RequestInit & { token?: string | null },
): Promise<T> {
  // Validate URL
  if (!url || typeof url !== "string") {
    throw new Error(`Invalid URL: ${url}`);
  }
  
  // Ensure URL is absolute (has protocol)
  if (!url.match(/^https?:\/\//i)) {
    throw new Error(
      `URL must be absolute with http:// or https:// protocol. Got: ${url}. ` +
      `Check NEXT_PUBLIC_API_BASE_URL environment variable.`
    );
  }

  const headers: any = {
    ...(opts?.headers || {}),
  };
  
  // Only set Content-Type for non-FormData requests
  // FormData requests need the browser to set Content-Type with boundary automatically
  if (!(opts?.body instanceof FormData)) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    // Remove Content-Type if it was set, let browser set it with boundary
    delete headers["Content-Type"];
  }
  
  if (opts?.token) headers["Authorization"] = `Bearer ${opts.token}`;

  try {
    const res = await fetch(url, { ...opts, headers });
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && (data as any).message) ||
        (typeof data === "string" ? data : null) ||
        `Request failed (${res.status})`;
      throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }
    return data as T;
  } catch (error: any) {
    // Improve CORS / network error messages (Safari often shows "Load failed")
    const isNetworkError =
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("Load failed") ||
      error?.message?.includes("CORS") ||
      error?.name === "TypeError";
    if (isNetworkError) {
      const host = (() => {
        try {
          return new URL(url).origin;
        } catch {
          return url.split("/").slice(0, 3).join("/");
        }
      })();
      throw new Error(
        `Request failed (${host}). ` +
          `On mobile or Vercel: set NEXT_PUBLIC_API_BASE_URL to a public HTTPS API URL and ensure the API is reachable from the internet. ` +
          `Also check CORS allows your app origin.`
      );
    }
    throw error;
  }
}

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
    // Improve CORS error messages
    if (error?.message?.includes("Failed to fetch") || error?.message?.includes("CORS")) {
      throw new Error(
        `Failed to fetch ${url}. ` +
        `Possible reasons: CORS not configured, backend not running, or invalid URL. ` +
        `Check that: 1) Backend is running on ${url.split("/")[0]}//${url.split("/")[2]}, ` +
        `2) CORS is enabled in backend, 3) NEXT_PUBLIC_API_BASE_URL is set correctly.`
      );
    }
    throw error;
  }
}

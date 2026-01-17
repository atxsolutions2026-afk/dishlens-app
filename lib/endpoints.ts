import { apiFetch, clearAccessToken, setAccessToken } from "@/lib/api";

export type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  user: any;
};

export async function login(email: string, password: string) {
  const result = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password } as any,
  });

  // Persist token so admin endpoints work (apiFetch will attach it automatically)
  if (result?.accessToken) setAccessToken(result.accessToken);

  return result;
}

export function logout() {
  clearAccessToken();
}

export async function listRestaurants() {
  return apiFetch<any>("/restaurants");
}

export async function adminMenu(restaurantId: string) {
  return apiFetch<any>(`/restaurants/${restaurantId}/menu`);
}

export async function publicMenu(slug: string) {
  return apiFetch<any>(`/public/restaurants/${encodeURIComponent(slug)}/menu`);
}

export async function createPublicOrder(
  slug: string,
  payload: {
    tableNumber: string;
    lines: { menuItemId: string; quantity: number }[];
    notes?: string;
  },
) {
  return apiFetch<any>(`/public/restaurants/${encodeURIComponent(slug)}/orders`, {
    method: "POST",
    body: payload as any,
  });
}

export async function listOrders(restaurantId: string, status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<any>(`/restaurants/${restaurantId}/orders${q}`);
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: string,
) {
  return apiFetch<any>(
    `/restaurants/${restaurantId}/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: { status } as any,
    },
  );
}

export async function uploadMenuItemImage(menuItemId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/menu-items/${menuItemId}/image`, {
    method: "POST",
    body: form,
    // IMPORTANT: don't set Content-Type; apiFetch will not set it for FormData
  });
}

export async function uploadMenuItemVideo(menuItemId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/menu-items/${menuItemId}/video`, {
    method: "POST",
    body: form,
  });
}

// Restaurant branding uploads
export async function uploadRestaurantLogo(restaurantId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/restaurants/${restaurantId}/logo`, {
    method: "POST",
    body: form,
  });
}

export async function uploadRestaurantHero(restaurantId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/restaurants/${restaurantId}/hero`, {
    method: "POST",
    body: form,
  });
}

export async function rateMenuItem(
  menuItemId: string,
  rating: number,
  clientId?: string,
) {
  return apiFetch<{ avgRating: number; ratingCount: number }>(
    `/public/menu-items/${menuItemId}/rating`,
    {
      method: "POST",
      body: { rating, clientId } as any,
    },
  );
}

// Admin ratings summary
// GET /restaurants/:id/ratings
export async function restaurantRatingsSummary(restaurantId: string) {
  return apiFetch<any>(`/restaurants/${restaurantId}/ratings`);
}

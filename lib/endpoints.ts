import { apiFetch } from "@/lib/api";

export async function login(email: string, password: string) {
  return apiFetch<{ accessToken: string; expiresIn: string; user: any }>(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function listRestaurants() {
  return apiFetch<any>("/restaurants");
}

export async function adminMenu(restaurantId: string) {
  return apiFetch<any>(`/restaurants/${restaurantId}/menu`);
}

export async function publicMenu(slug: string) {
  return apiFetch<any>(
    `/public/restaurants/${encodeURIComponent(slug)}/menu`
  );
}

export async function uploadMenuItemImage(menuItemId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/menu-items/${menuItemId}/image`, {
    method: "POST",
    body: form, // ✅ FormData is valid for fetch
  });
}

export async function uploadMenuItemVideo(menuItemId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<any>(`/menu-items/${menuItemId}/video`, {
    method: "POST",
    body: form, // ✅ FormData is valid for fetch
  });
}

// Restaurant branding uploads
export async function uploadRestaurantLogo(restaurantId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<any>(`/restaurants/${restaurantId}/logo`, { method: "POST", body: form });
}

export async function uploadRestaurantHero(restaurantId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<any>(`/restaurants/${restaurantId}/hero`, { method: "POST", body: form });
}

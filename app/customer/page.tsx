import { redirect } from "next/navigation";
import { restaurantSlug } from "@/lib/env";

export default function LegacyCustomerRedirect() {
  redirect(`/m/${encodeURIComponent(restaurantSlug())}`);
}

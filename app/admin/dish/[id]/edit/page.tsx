import { redirect } from "next/navigation";

export default function LegacyEditDishRedirect() {
  redirect("/r/menu");
}

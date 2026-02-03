import { redirect } from "next/navigation";

/**
 * Uploads functionality has been merged into Menu.
 * Redirect legacy /r/uploads to /r/menu.
 */
export default function UploadsRedirect() {
  redirect("/r/menu");
}

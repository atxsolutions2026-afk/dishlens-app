import { redirect } from "next/navigation";

export default function LegacyUploadRedirect() {
  redirect("/r/uploads");
}

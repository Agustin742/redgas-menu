import { redirect } from "next/navigation";

// The root has no public content: customers reach menus at /c/<slug> via QR.
// /login forwards to /admin when a session already exists.
export default function RootPage() {
  redirect("/login");
}

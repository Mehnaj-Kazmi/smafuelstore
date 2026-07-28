import type { Metadata } from "next";
import HomepageAdmin from "./HomepageAdmin";

export const metadata: Metadata = { title: "Homepage" };

/** Server shell so the route can export metadata; the editor is interactive. */
export default function AdminHomepagePage() {
  return <HomepageAdmin />;
}

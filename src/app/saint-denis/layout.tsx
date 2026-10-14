import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import { BUNDLED } from "@/lib/brand-assets";
import { logoutAction } from "./actions";
import AdminShell from "@/components/studio/AdminShell";

export const metadata: Metadata = {
  title: "RAWIN Studio",
  description: "Private administration for RAWIN.",
  robots: {
    index: false,
    follow: false,
  },
};

function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 min-h-11 px-3 rounded-xl text-[13px] text-fg-muted hover:text-danger hover:bg-danger/10"
        aria-label="Sign out of this browser"
        title="Sign out"
      >
        <LogOut aria-hidden="true" className="w-4 h-4" />
        <span className="hidden lg:inline">Sign out</span>
      </button>
    </form>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Signed out (e.g. /saint-denis/login): the page renders on its own, without studio chrome
  if (!session) {
    return <div data-admin-portal="true">{children}</div>;
  }

  // The studio identity follows the same Header brand choice as the public header (cached
  // content; saving Site Content invalidates it like every other consumer). If the content
  // cannot be read, the studio still opens with the typographic wordmark.
  const content = await getSiteContent().catch(() => null);
  const brand = {
    mode: content?.global?.headerBrand === "logo" ? ("logo" as const) : ("wordmark" as const),
    logos: {
      light: content?.assets.logoLight ?? { url: BUNDLED.logoLight, alt: "RAWIN" },
      dark: content?.assets.logoDark ?? { url: BUNDLED.logoDark, alt: "RAWIN" },
    },
  };

  return (
    <AdminShell email={session.email} brand={brand} signOut={<SignOutButton />}>
      {children}
    </AdminShell>
  );
}

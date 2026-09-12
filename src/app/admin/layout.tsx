import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, LogOut, ExternalLink } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Portal | RAWIN 3.0",
  description: "Private administrative management portal for RAWIN 3.0.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, content] = await Promise.all([
    getAdminSession(),
    getSiteContent(),
  ]);

  // If unauthenticated (e.g. at /admin/login), render isolated content without admin chrome
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-ink-black text-foreground flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-ink-black/80 backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Left */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 group transition-opacity"
              aria-label="RAWIN Admin Dashboard"
            >
              <Image
                src={content.assets?.logo?.url || "/images/logo.png"}
                alt={content.assets?.logo?.alt || "RAWIN Logo"}
                width={95}
                height={32}
                unoptimized
                className="h-6 w-auto object-contain"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/25 font-semibold">
                ADMIN
              </span>
            </Link>

            <div className="hidden sm:block h-4 w-[1px] bg-white/10" />

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-pacific-cyan transition-colors"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* User Status & Logout Right */}
          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-muted"
              title={session.email}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[200px]">{session.email}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
                title="Sign out of administrative session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

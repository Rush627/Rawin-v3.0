"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  FileText,
  FolderGit2,
  Image as ImageIcon,
  LayoutGrid,
  MoreHorizontal,
  PanelsTopLeft,
  Settings2,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import StudioBrand, { type StudioBrandConfig } from "./StudioBrand";
import { UnsavedChangesProvider } from "./UnsavedChanges";

export const STUDIO_NAV = [
  { href: "/saint-denis", label: "Overview", short: "Overview", icon: LayoutGrid, exact: true },
  { href: "/saint-denis/content", label: "Site Content", short: "Content", icon: PanelsTopLeft },
  { href: "/saint-denis/projects", label: "Projects", short: "Projects", icon: FolderGit2 },
  { href: "/saint-denis/blog", label: "Journal", short: "Journal", icon: FileText },
  { href: "/saint-denis/media", label: "Media & Identity", short: "Media", icon: ImageIcon },
  { href: "/saint-denis/orbit", label: "Orbit Intelligence", short: "Orbit", icon: Bot },
  { href: "/saint-denis/analytics", label: "Analytics", short: "Analytics", icon: BarChart3 },
  { href: "/saint-denis/settings", label: "Settings", short: "Settings", icon: Settings2 },
] as const;

/** Phones show the first four destinations as tabs; the rest live under More. */
const PHONE_TABS = STUDIO_NAV.slice(0, 4);
const PHONE_MORE = STUDIO_NAV.slice(4);

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Theme switch with its current state written out; the button itself names the action. */
function ThemeRow() {
  const { resolved } = useTheme();
  return (
    <div className="flex items-center justify-between gap-2 pl-1">
      <span className="text-[12.5px] text-fg-muted">{resolved === "dark" ? "Dark theme" : "Light theme"}</span>
      <ThemeToggle className="hover:bg-surface-2" />
    </div>
  );
}

export default function AdminShell({ email, brand, signOut, children }: { email: string; brand: StudioBrandConfig; signOut: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || "";
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const moreActive = PHONE_MORE.some((item) => isActive(pathname, item.href));

  return (
    <UnsavedChangesProvider>
      <div data-admin-portal="true" className="admin-studio relative h-screen h-dvh max-h-dvh w-full bg-bg text-fg flex flex-col lg:flex-row overflow-hidden">
        <a href="#studio-main" className="skip-link btn btn-primary btn-sm">
          Skip to content
        </a>

        {/* Desktop rail */}
        <aside className="hidden lg:flex relative z-20 w-[248px] shrink-0 h-full flex-col border-r border-line bg-bg-raised overflow-y-auto overscroll-contain">
          <div className="min-h-full flex flex-col p-4">
            <Link href="/saint-denis" className="flex items-center h-12 px-3 mb-6 rounded-xl shrink-0" aria-label="RAWIN Studio overview">
              <StudioBrand brand={brand} />
            </Link>
            <nav aria-label="Studio" className="flex flex-col gap-0.5 shrink-0">
              {STUDIO_NAV.map((item) => {
                const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] transition-colors ${
                      active ? "bg-surface text-fg border border-line shadow-[var(--shadow-1)]" : "text-fg-muted hover:text-fg hover:bg-surface/60 border border-transparent"
                    }`}
                  >
                    <Icon aria-hidden="true" className={`w-4 h-4 ${active ? "text-accent" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-4 flex flex-col gap-2 shrink-0">
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between h-11 px-3 rounded-xl text-[14px] text-fg-muted hover:text-fg hover:bg-surface/60">
                View site
                <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
              </a>
              <div className="rounded-xl border border-line bg-surface/70 p-2.5 flex flex-col gap-1">
                <ThemeRow />
                <div className="h-px bg-line mx-1" />
                <p className="px-1 pt-1 text-[12.5px] text-fg-muted truncate" title={email}>
                  {email}
                </p>
                <div className="flex justify-end">{signOut}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="relative z-10 flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {/* Phone / tablet top bar */}
          <header className="lg:hidden shrink-0 z-40 border-b border-line bg-bg/95 backdrop-blur px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between gap-3 h-14">
              <Link href="/saint-denis" className="flex items-center min-h-11 min-w-0" aria-label="RAWIN Studio overview">
                <StudioBrand brand={brand} compact />
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle className="text-fg-muted hover:text-fg" />
                <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-fg-muted hover:text-fg" aria-label="View site (opens in a new tab)">
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </header>

          <main id="studio-main" tabIndex={-1} className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain focus:outline-none">
            <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-16">
              {children}
            </div>
          </main>
        </div>

        {/* Phone / tablet tab bar */}
        <nav aria-label="Studio" className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg-raised/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <ul className="grid grid-cols-5">
            {PHONE_TABS.map((item) => {
              const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center justify-center gap-1 h-16 text-[11px] ${active ? "text-fg" : "text-fg-subtle"}`}
                  >
                    <Icon aria-hidden="true" className={`w-5 h-5 ${active ? "text-accent" : ""}`} />
                    {item.short}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(true)}
                className={`w-full flex flex-col items-center justify-center gap-1 h-16 text-[11px] ${moreActive ? "text-fg" : "text-fg-subtle"}`}
              >
                <MoreHorizontal aria-hidden="true" className={`w-5 h-5 ${moreActive ? "text-accent" : ""}`} />
                More
              </button>
            </li>
          </ul>
        </nav>

        <MoreSheet open={moreOpen} onClose={closeMore} pathname={pathname} email={email} signOut={signOut} />
      </div>
    </UnsavedChangesProvider>
  );
}

function MoreSheet({ open, onClose, pathname, email, signOut }: { open: boolean; onClose: () => void; pathname: string; email: string; signOut: ReactNode }) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastPath = useRef(pathname);

  // close after navigating, on Escape; focus moves into the sheet and back to "More"
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <div aria-hidden="true" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-bg-raised px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between h-12">
          <h2 id={`${id}-title`} className="text-[15px] font-semibold">
            More
          </h2>
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-fg-muted" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="flex flex-col gap-1 mt-1">
          {PHONE_MORE.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 min-h-12 px-3 rounded-xl text-[15px] ${active ? "bg-surface text-fg border border-line" : "text-fg"}`}
                >
                  <Icon aria-hidden="true" className="w-5 h-5 text-fg-muted" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-line flex flex-col gap-1">
          <ThemeRow />
          <div className="flex items-center justify-between gap-3">
            <p className="pl-1 text-[12.5px] text-fg-muted truncate">{email}</p>
            <div className="shrink-0">{signOut}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

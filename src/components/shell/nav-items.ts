export const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Uses", href: "/uses" },
  { name: "Resume", href: "/resume" },
  { name: "Analytics", href: "/analytics" },
  { name: "Contact", href: "/contact" },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type LenisLike = {
  scrollTo: (target: number | HTMLElement, options?: { immediate?: boolean }) => void;
  stop?: () => void;
  start?: () => void;
};

export function getLenis(): LenisLike | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __lenis?: LenisLike | null }).__lenis ?? null;
}

export function scrollToTop() {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0);
    return;
  }
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

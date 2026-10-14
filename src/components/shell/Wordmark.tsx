interface LogoVariant {
  url?: string;
  alt?: string;
}

export interface WordmarkProps {
  className?: string;
  /** "logo" renders the theme logo images instead of the typographic wordmark */
  mode?: "wordmark" | "logo";
  /** Light = shown on the light theme (dark ink); Dark = shown on the dark theme */
  logos?: { light?: LogoVariant; dark?: LogoVariant };
  size?: "sm" | "md";
  /** Deprecated mark flag preserved for interface compatibility; obsolete mark is never rendered */
  withMark?: boolean;
}

/**
 * RAWIN canonical brand lockup. Renders either the CMS-selected logo images (theme-aware)
 * or the typographical RAWIN wordmark. Never renders the retired standalone R icon.
 */
export default function Wordmark({ className = "", mode = "wordmark", logos, size = "md" }: WordmarkProps) {
  const text = size === "sm" ? "text-[0.8rem]" : "text-[0.9rem] sm:text-[0.95rem]";

  if (mode === "logo" && logos?.light?.url && logos?.dark?.url) {
    const alt = logos.light.alt || logos.dark.alt || "RAWIN";
    return (
      <span className={`relative inline-flex items-center w-[5.2em] h-[1.15em] ${text} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logos.light.url} alt={alt} className="w-full h-full object-contain object-left dark:hidden" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logos.dark.url} alt={alt} className="w-full h-full object-contain object-left hidden dark:block" decoding="async" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="RAWIN">
      <span aria-hidden="true" className={`font-sans font-semibold tracking-[0.28em] ${text} leading-none text-fg`}>
        RAWIN
      </span>
    </span>
  );
}


import BrandMark from "./BrandMark";

interface LogoVariant {
  url?: string;
  alt?: string;
}

interface WordmarkProps {
  className?: string;
  /** "logo" renders the theme logo images instead of the typographic wordmark */
  mode?: "wordmark" | "logo";
  /** Light = shown on the light theme (dark ink); Dark = shown on the dark theme */
  logos?: { light?: LogoVariant; dark?: LogoVariant };
  size?: "sm" | "md";
  /** Show the standalone brand mark beside the wordmark (off in the navbar) */
  withMark?: boolean;
}

/**
 * RAWIN brand lockup. The typographic wordmark is theme-native: the monoline "R"
 * mark beside tracked capitals. Logo mode shows the light- or dark-theme logo image; both are
 * in the markup and the active theme's stylesheet shows one, so switching themes never
 * flashes the wrong variant and no colour filters are applied to the artwork.
 */
export default function Wordmark({ className = "", mode = "wordmark", logos, size = "md", withMark = true }: WordmarkProps) {
  const text = size === "sm" ? "text-[0.8rem]" : "text-[0.9rem] sm:text-[0.95rem]";

  if (mode === "logo" && logos?.light?.url && logos?.dark?.url) {
    const alt = logos.light.alt || logos.dark.alt || "RAWIN";
    // The logo occupies the typographic wordmark's own footprint (sized in em of the same font
    // size: about the width of tracked "RAWIN" and its cap height plus a little), fitted inside
    // with object-contain. A tightly cropped logo then matches the wordmark's letter height; any
    // logo keeps its proportions, and both theme variants render at the same size.
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
      {withMark && <BrandMark className="w-[1.35em] h-[1.35em] -my-1 text-fg" />}
      <span aria-hidden="true" className={`font-sans font-semibold tracking-[0.28em] ${text} leading-none text-fg`}>
        RAWIN
      </span>
    </span>
  );
}

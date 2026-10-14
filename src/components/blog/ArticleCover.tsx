import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { PROJECT_TONES, TONE_SWATCH } from "@/lib/project-tone";

interface ArticleCoverProps {
  post: Pick<BlogPost, "title" | "slug" | "coverImage" | "category" | "tags" | "publishedAt">;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Typographic plate scale when no image exists */
  scale?: "lg" | "md" | "sm";
}

function toneFor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 33 + slug.charCodeAt(i)) >>> 0;
  return TONE_SWATCH[PROJECT_TONES[hash % PROJECT_TONES.length]];
}

/**
 * Article cover. Uses the uploaded cover when present; otherwise a designed
 * editorial plate — a large initial, a spectral field, and filing metadata —
 * so an absent image reads as intentional rather than missing.
 */
export default function ArticleCover({ post, className = "", sizes = "100vw", priority, scale = "md" }: ArticleCoverProps) {
  if (post.coverImage) {
    return (
      <div data-field-surface="image" className={`relative overflow-hidden bg-sunken ${className}`}>
        <Image
          src={post.coverImage}
          alt=""
          fill
          priority={priority}
          unoptimized
          sizes={sizes}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  const sw = toneFor(post.slug || post.title);
  const initial = post.title.trim().charAt(0).toUpperCase() || "R";
  const label = post.category || post.tags[0] || "Dev log";
  const year = post.publishedAt ? new Date(post.publishedAt).getFullYear() : "";
  const initialSize = scale === "lg" ? "text-[clamp(10rem,26vw,22rem)]" : scale === "sm" ? "text-[6rem]" : "text-[clamp(7rem,14vw,12rem)]";

  return (
    <div
      aria-hidden="true"
      data-field-surface="image"
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(90% 80% at 100% 0%, ${sw.c}, transparent 60%), radial-gradient(80% 90% at 0% 100%, ${sw.b}, transparent 65%), ${sw.a}`,
        color: sw.ink,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Ruled baseline grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px)", backgroundSize: "100% 28px" }}
      />
      <span
        className={`absolute -bottom-[0.18em] right-[0.04em] font-display italic leading-none select-none opacity-90 transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:-translate-y-2 ${initialSize}`}
      >
        {initial}
      </span>
      <div className="absolute left-0 top-0 p-[6%] flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80">{label}</span>
        {year && <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-50">Vol. {year}</span>}
      </div>
    </div>
  );
}

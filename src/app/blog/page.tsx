import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BookOpen, ArrowRight, Sparkles, PenLine } from "lucide-react";
import { getPublishedPosts } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";

export const metadata: Metadata = {
  title: "The Dev Log | Rushan Siddiqui",
  description:
    "Exploring the intersection of software architecture, intelligent agents, and performant web systems.",
};

export const revalidate = 0;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "RECENT";
  try {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "short", year: "numeric" })
      .toUpperCase();
  } catch {
    return (dateStr || "RECENT").toUpperCase();
  }
}

function formatReadTime(readTime?: string): string {
  if (!readTime) return "5 MIN READ";
  const upper = readTime.toUpperCase();
  if (upper.includes("READ")) return upper;
  return `${upper} READ`;
}

/** Typographic cover fallback shown when no coverImage is present */
function ArticleCoverFallback({ title, index }: { title: string; index: number }) {
  const accents = [
    "from-pacific-cyan/20 to-transparent",
    "from-apricot-cream/15 to-transparent",
    "from-pacific-cyan/10 via-apricot-cream/10 to-transparent",
  ];
  const accent = accents[index % accents.length];

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-full bg-gradient-to-br ${accent} overflow-hidden`}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* First letter accent */}
      <div className="absolute bottom-4 right-5 text-[5rem] sm:text-[6rem] font-bold font-space text-white/[0.05] leading-none select-none pointer-events-none">
        {title.trim().charAt(0).toUpperCase()}
      </div>
      {/* Thin top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pacific-cyan/60 to-transparent" />
    </div>
  );
}

/** Featured Article : Editorial Lead Entry */
function FeaturedArticle({ post, isFeatured }: { post: BlogPost; isFeatured: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/50 rounded-2xl"
      aria-label={`Read ${post.title}`}
    >
      <article className="relative w-full rounded-2xl border border-white/[0.08] group-hover:border-pacific-cyan/30 overflow-hidden transition-all duration-300 bg-gradient-to-b from-[#161626]/95 via-[#131322]/90 to-[#101019]/95 shadow-[0_4px_24px_rgba(0,0,0,0.28)] md:grid md:grid-cols-12 md:gap-0">
        {/* Subtle ambient radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(24,155,173,0.06)_0%,transparent_60%)]"
          aria-hidden="true"
        />

        {/* Cover image or fallback */}
        <div className="relative w-full h-52 sm:h-60 md:h-full min-h-[220px] md:min-h-[300px] md:col-span-5 lg:col-span-5 overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.06] bg-ink-black/60 shrink-0">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              unoptimized
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          ) : (
            <ArticleCoverFallback title={post.title} index={0} />
          )}
          {/* Subtle bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.7)] via-transparent to-transparent pointer-events-none" />

          {/* Featured marker */}
          {isFeatured && (
            <div className="absolute top-3.5 left-3.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-ink-black/85 backdrop-blur-sm border border-pacific-cyan/30 text-pacific-cyan uppercase tracking-wider">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-7 md:col-span-7 lg:col-span-7 flex flex-col justify-between gap-3.5 sm:gap-4">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {/* Metadata row */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted/70 tracking-wider uppercase flex-wrap">
              <span>{formatDate(post.publishedAt)}</span>
              <span className="text-white/20" aria-hidden="true">
                &middot;
              </span>
              <span>{formatReadTime(post.readTime)}</span>
              {isFeatured && (
                <>
                  <span className="text-white/20" aria-hidden="true">
                    &middot;
                  </span>
                  <span className="text-apricot-cream/90 font-medium">Featured</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl lg:text-[1.65rem] font-bold font-space text-foreground leading-snug tracking-tight group-hover:text-pacific-cyan transition-colors duration-200">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xs sm:text-sm text-muted/80 leading-relaxed font-sans line-clamp-3">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Bottom row: tags + arrow */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.06]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-pacific-cyan/80 group-hover:text-pacific-cyan transition-colors ml-auto">
              <span>Read Entry</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Regular Article Card : Editorial Engineering Log Card */
function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/50 rounded-2xl"
      aria-label={`Read ${post.title}`}
    >
      <article className="h-full flex flex-col rounded-2xl border border-white/[0.08] group-hover:border-pacific-cyan/30 overflow-hidden bg-gradient-to-b from-[#161626]/95 via-[#131322]/90 to-[#101019]/95 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300">
        {/* Cover image or fallback */}
        {post.coverImage ? (
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] max-h-44 sm:max-h-48 overflow-hidden border-b border-white/[0.06] bg-ink-black/60 shrink-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              loading="lazy"
              unoptimized
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.7)] via-transparent to-transparent pointer-events-none" />
            {post.featured && (
              <div className="absolute top-2.5 left-2.5 flex items-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-ink-black/85 backdrop-blur-sm border border-pacific-cyan/30 text-pacific-cyan uppercase tracking-wider">
                  Featured
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] max-h-40 sm:max-h-44 overflow-hidden border-b border-white/[0.06] shrink-0">
            <ArticleCoverFallback title={post.title} index={index + 1} />
          </div>
        )}

        {/* Content area */}
        <div className="flex flex-col gap-3 p-4 sm:p-5 flex-1 justify-between">
          <div className="flex flex-col gap-2">
            {/* Metadata row */}
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-muted/70 tracking-wider uppercase flex-wrap">
              <span>{formatDate(post.publishedAt)}</span>
              <span className="text-white/20" aria-hidden="true">
                &middot;
              </span>
              <span>{formatReadTime(post.readTime)}</span>
              {post.featured && (
                <>
                  <span className="text-white/20" aria-hidden="true">
                    &middot;
                  </span>
                  <span className="text-apricot-cream/90 font-medium">Featured</span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold font-space text-foreground leading-snug tracking-tight group-hover:text-pacific-cyan transition-colors duration-200 line-clamp-2 sm:line-clamp-3">
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xs text-muted/80 leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Bottom row: tags + arrow */}
          <div className="pt-2.5 sm:pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 mt-auto">
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.06]"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-pacific-cyan/70 group-hover:text-pacific-cyan group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-auto" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  // Featured article: prefer first featured post, else first published post
  const featuredPost = posts.find((p) => p.featured) ?? posts[0] ?? null;
  const featuredIsFeatured = featuredPost?.featured ?? false;

  // Remaining posts (excluding the featured)
  const remainingPosts = featuredPost
    ? posts.filter((p) => (p._id || p.slug) !== (featuredPost._id || featuredPost.slug))
    : [];

  return (
    <div className="w-full max-w-5xl mx-auto pt-32 sm:pt-36 lg:pt-28 pb-10 sm:pb-12 px-4 sm:px-6 flex flex-col gap-10 sm:gap-12 lg:gap-14">
      {/* ─── PAGE HEADER / EDITORIAL HERO ─── */}
      <section className="flex flex-col gap-3.5 sm:gap-4.5 max-w-3xl">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Articles &amp; Architecture Notes</span>
        </div>

        {/* Primary Editorial Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space leading-[1.15]">
            The Dev <span className="text-pacific-cyan">Log</span>
          </h1>
          {/* Thin accent rule */}
          <div className="flex items-center gap-2.5 mt-0.5">
            <div className="h-[2px] w-10 bg-pacific-cyan/50 rounded-full" />
            <div className="h-[1px] w-5 bg-pacific-cyan/20 rounded-full" />
          </div>
        </div>

        {/* Subheading / Positioning Statement */}
        <p className="text-sm sm:text-base lg:text-lg text-muted/90 leading-relaxed max-w-2xl">
          Exploring the intersection of software architecture, intelligent agents, and performant web systems.
        </p>

        {/* Dynamic Article Count */}
        {posts.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted/60">
            <PenLine className="w-3.5 h-3.5 text-pacific-cyan/60" />
            <span>
              {posts.length} published article{posts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </section>

      {/* ─── CONTENT STATES ─── */}
      {posts.length === 0 ? (
        /* Empty state */
        <section
          className="flex flex-col items-center gap-5 py-24 text-center"
          aria-label="No articles yet"
        >
          <div className="w-14 h-14 rounded-2xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-pacific-cyan/60" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold font-space text-foreground">Writing is in progress</h2>
            <p className="text-sm text-muted font-mono max-w-sm leading-relaxed">
              New technical reflections and architecture notes will appear here once published.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* ─── FEATURED ARTICLE ─── */}
          {featuredPost && (
            <section aria-label={featuredIsFeatured ? "Featured article" : "Latest article"}>
              <FeaturedArticle post={featuredPost} isFeatured={featuredIsFeatured} />
            </section>
          )}

          {/* ─── RECENT ENTRIES STREAM ─── */}
          {remainingPosts.length > 0 && (
            <section aria-label="Recent entries" className="flex flex-col gap-6">
              {/* Section header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">
                    Recent Entries
                  </span>
                </div>
                <span className="text-xs font-mono text-muted/40">
                  {remainingPosts.length} {remainingPosts.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Grid */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
                role="list"
                aria-label="Article list"
              >
                {remainingPosts.map((post, i) => (
                  <div key={post._id || post.slug} role="listitem">
                    <ArticleCard post={post} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Edge case: only 1 post total (featured only, no remaining) */}
          {remainingPosts.length === 0 && posts.length > 1 && (
            <section aria-label="Recent entries" className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">
                  Recent Entries
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6" role="list">
                {posts.slice(1).map((post, i) => (
                  <div key={post._id || post.slug} role="listitem">
                    <ArticleCard post={post} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}


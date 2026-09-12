import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BookOpen, Calendar, Clock, ArrowRight, Sparkles, PenLine } from "lucide-react";
import { getPublishedPosts } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";
import BlogCard3D from "@/components/BlogCard3D";

export const metadata: Metadata = {
  title: "Blog & Architecture Notes | Rushan Siddiqui",
  description:
    "Engineering insights, web performance deep dives, and architectural patterns by Rushan Siddiqui.",
};

export const revalidate = 0;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDateLong(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

/** Typographic cover fallback : shown when no coverImage is present */
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
      <div className="absolute bottom-4 right-5 text-[6rem] font-bold font-space text-white/[0.05] leading-none select-none pointer-events-none">
        {title.trim().charAt(0).toUpperCase()}
      </div>
      {/* Thin top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pacific-cyan/60 to-transparent" />
    </div>
  );
}

/** Featured / Latest article : dominant editorial card */
function FeaturedArticle({ post, isFeatured }: { post: BlogPost; isFeatured: boolean }) {
  return (
    <BlogCard3D isFeatured={isFeatured} className="w-full">
      <Link href={`/blog/${post.slug}`} className="group block" aria-label={`Read: ${post.title}`}>
        <article className="relative rounded-2xl border border-white/[0.08] group-hover:border-pacific-cyan/30 overflow-hidden transition-all duration-300 bg-[rgba(22,22,34,0.5)]">
        {/* Cover image / fallback */}
        <div className="relative w-full h-52 sm:h-64 md:h-72 overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          ) : (
            <ArticleCoverFallback title={post.title} index={0} />
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.92)] via-[rgba(16,16,25,0.4)] to-transparent" />

          {/* Badge overlaid on image */}
          <div className="absolute top-5 left-5 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-ink-black/70 backdrop-blur-sm border border-pacific-cyan/30 text-pacific-cyan">
              {isFeatured ? "FEATURED" : "LATEST"}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted/70">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-pacific-cyan/70" />
              {formatDateLong(post.publishedAt)}
            </span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-pacific-cyan/70" />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-bold font-space text-foreground leading-tight tracking-tight group-hover:text-pacific-cyan transition-colors duration-300">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm sm:text-base text-muted leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Bottom row: tags + CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] font-mono text-pacific-cyan/80 bg-pacific-cyan/[0.07] border border-pacific-cyan/15"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-pacific-cyan group-hover:gap-2.5 transition-all duration-200">
              Read Article
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
    </BlogCard3D>
  );
}

/** Regular article card : editorial grid item */
function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <BlogCard3D isFeatured={false} className="h-full">
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full"
        aria-label={`Read: ${post.title}`}
      >
        <article className="h-full flex flex-col rounded-xl border border-white/[0.06] group-hover:border-pacific-cyan/25 overflow-hidden bg-[rgba(22,22,34,0.45)] transition-all duration-300">
        {/* Cover image or fallback : compact */}
        {post.coverImage ? (
          <div className="relative w-full h-36 overflow-hidden shrink-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              loading="lazy"
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.8)] to-transparent" />
          </div>
        ) : (
          <div className="relative w-full h-28 overflow-hidden shrink-0">
            <ArticleCoverFallback title={post.title} index={index + 1} />
          </div>
        )}

        {/* Card body */}
        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Meta row */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono text-muted/60">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span>{post.readTime}</span>
            {post.featured && (
              <>
                <span className="text-white/20" aria-hidden="true">·</span>
                <span className="text-apricot-cream/70 font-semibold">Featured</span>
              </>
            )}
          </div>

          {/* Title : primary element */}
          <h3 className="text-base sm:text-lg font-bold font-space text-foreground leading-snug tracking-tight group-hover:text-pacific-cyan transition-colors duration-300 line-clamp-3 flex-1">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xs text-muted/80 leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Tags + arrow */}
          <div className="pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 mt-auto">
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted/60 bg-white/[0.04] border border-white/[0.05]"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-pacific-cyan/60 group-hover:translate-x-1 group-hover:text-pacific-cyan transition-all duration-200" />
          </div>
        </div>
      </article>
    </Link>
    </BlogCard3D>
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
    <div className="w-full max-w-5xl mx-auto pt-28 pb-20 px-4 sm:px-6 flex flex-col gap-16">

      {/* ─── HERO ─── */}
      <section className="flex flex-col gap-5 max-w-3xl">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Articles &amp; Architecture Notes</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-foreground font-space leading-[1.1]">
            Engineering{" "}
            <span className="text-pacific-cyan">Writing</span>
          </h1>
          {/* Thin accent rule */}
          <div className="flex items-center gap-3 mt-1">
            <div className="h-[2px] w-10 bg-pacific-cyan/50 rounded-full" />
            <div className="h-[1px] w-6 bg-pacific-cyan/20 rounded-full" />
          </div>
        </div>

        {/* Description */}
        <p className="text-base text-muted leading-relaxed max-w-xl">
          Reflections on software architecture, frontend performance, serverless systems, and
          interface craftsmanship.
        </p>

        {/* Stats line */}
        {posts.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted/50">
            <PenLine className="w-3.5 h-3.5 text-pacific-cyan/50" />
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
          {/* ─── FEATURED / LATEST ARTICLE ─── */}
          {featuredPost && (
            <section aria-label={featuredIsFeatured ? "Featured article" : "Latest article"}>
              <FeaturedArticle post={featuredPost} isFeatured={featuredIsFeatured} />
            </section>
          )}

          {/* ─── ALL ARTICLES GRID ─── */}
          {remainingPosts.length > 0 && (
            <section aria-label="All articles" className="flex flex-col gap-8">
              {/* Section header */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-mono text-muted/50 uppercase tracking-widest">
                    All Articles
                  </span>
                  <div className="h-[1px] w-16 bg-white/[0.08]" />
                </div>
                <span className="text-[11px] font-mono text-muted/40">
                  {remainingPosts.length} more
                </span>
              </div>

              {/* Grid */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
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
            <section aria-label="All articles" className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-muted/50 uppercase tracking-widest">
                  All Articles
                </span>
                <div className="h-[1px] flex-1 bg-white/[0.06] max-w-[80px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="list">
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

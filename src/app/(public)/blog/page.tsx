import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedPosts, type BlogPost } from "@/lib/blog";
import MaskText from "@/components/system/MaskText";
import Reveal from "@/components/system/Reveal";
import ArticleCover from "@/components/blog/ArticleCover";
import { formatPostDate, formatReadTime } from "@/components/blog/format";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("blog", "/blog");
}

export const revalidate = 3600;

function Meta({ post, className = "", stacked = false }: { post: BlogPost; className?: string; stacked?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 label-mono text-fg-subtle ${className}`}>
      {post.category && <span className="text-accent">{post.category}</span>}
      <span>{formatPostDate(post.publishedAt)}</span>
      {/* the separator only reads on one line; a stacked column (archive, md+) drops it */}
      <span aria-hidden="true" className={stacked ? "md:hidden" : ""}>
        ·
      </span>
      <span>{formatReadTime(post.readTime)}</span>
    </p>
  );
}

/** Featured / latest story: cover and text share one balanced grid (cover about 56% on desktop). */
function LeadStory({ post, featured }: { post: BlogPost; featured: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-y-5 sm:gap-y-7 lg:gap-x-12 xl:gap-x-16 lg:items-center"
    >
      <div className="relative">
        <ArticleCover
          post={post}
          priority
          scale="lg"
          sizes="(min-width: 1024px) 700px, 100vw"
          className="w-full aspect-[16/10] rounded-[20px] sm:rounded-[28px] border border-line shadow-[var(--shadow-3)]"
        />
        {/* positioned wrapper: .glass-fallback sets position:relative (unlayered), which would
            override an absolute utility on the same element */}
        <span className="absolute top-3 left-3 sm:top-5 sm:left-5">
          <span className="block glass-fallback rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 label-mono text-fg">{featured ? "Featured" : "Latest"}</span>
        </span>
      </div>
      <div className="min-w-0">
        <Meta post={post} />
        <h2 className="blog-lead-title mt-3 sm:mt-5 font-display text-fg group-hover:italic">{post.title}</h2>
        {post.excerpt && (
          <p className="mt-3 sm:mt-5 text-[15.5px] sm:text-[17px] leading-relaxed text-fg-muted line-clamp-3 sm:line-clamp-4">{post.excerpt}</p>
        )}
        <div className="mt-5 sm:mt-8 pt-4 sm:pt-5 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="text-sm text-fg-muted">
            {post.author ? (
              <>
                By <span className="text-fg">{post.author}</span>
              </>
            ) : (
              "RAWIN Dev Log"
            )}
          </span>
          <span className="inline-flex items-center gap-2 min-h-10 text-sm font-medium text-fg">
            <span className="link-draw">Read the entry</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Secondary entries: equal editorial cards, one cover ratio. */
function PairStory({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <ArticleCover post={post} sizes="(min-width: 768px) 600px, 100vw" className="w-full aspect-[16/10] rounded-[18px] sm:rounded-[22px] border border-line" />
      <Meta post={post} className="mt-4 sm:mt-5" />
      <h3 className="blog-card-title mt-2.5 sm:mt-3 font-display text-fg group-hover:italic">{post.title}</h3>
      {post.excerpt && <p className="mt-2 sm:mt-3 text-[15px] text-fg-muted leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-[56ch]">{post.excerpt}</p>}
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const lead = posts.find((p) => p.featured) ?? posts[0] ?? null;
  const rest = lead ? posts.filter((p) => (p._id || p.slug) !== (lead._id || lead.slug)) : [];
  const pair = rest.slice(0, 2);
  const archive = rest.slice(2);
  // archive numbering continues the page's own sequence (lead, pair, then the archive)
  const archiveStart = (lead ? 1 : 0) + pair.length;
  const topics = Array.from(new Set(posts.flatMap((p) => [p.category, ...p.tags]).filter(Boolean) as string[])).slice(0, 10);

  return (
    <div className="blog-scope flex flex-col">
      {/* Hero: a title column and a context column on one grid (shared with the featured story
          and the archive below). The context column carries the entry statistics and the topic
          index; on phones they follow the title, the topics as one swipeable line. The header
          starts lower on phones so the Orbit pill above it has room to breathe. */}
      <header className="blog-shell blog-hero">
        <div className="flex items-center justify-between gap-4 label-mono text-fg-muted mb-5 sm:mb-10 lg:mb-12">
          <span className="inline-flex items-center gap-3 min-w-0">
            <span className="blog-ice">03</span>
            <span className="h-px w-8 bg-line-strong shrink-0" />
            <span className="truncate">Articles &amp; architecture notes</span>
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-fg-subtle">
            RAWIN / v3
          </span>
        </div>
        <div className="blog-hero-grid">
          <div className="min-w-0" style={{ "--fit-max": "4rem" } as CSSProperties}>
            <MaskText
              as="h1"
              immediate
              className="blog-hero-title text-fg"
              lines={[
                <span key="t">
                  The Dev <em className="italic text-accent">Log</em>
                </span>,
              ]}
              phoneInline={{ chars: "The Dev Log".length }}
            />
            <p className="mt-3 sm:mt-7 max-w-[44ch] text-[15.5px] sm:text-lg leading-relaxed text-fg-muted">
              Exploring the intersection of software architecture, intelligent agents, and performant web systems.
            </p>
          </div>
          <aside className="blog-hero-aside" aria-label="About the log">
            <dl className="grid grid-cols-2 gap-x-6 border-t border-line">
              {[
                { label: "Entries", value: String(posts.length).padStart(2, "0") },
                { label: "Latest", value: lead ? formatPostDate(lead.publishedAt) : "-" },
              ].map((m) => (
                <div key={m.label} className="py-2.5 sm:py-3.5 border-b border-line">
                  <dt className="label-mono text-fg-subtle">{m.label}</dt>
                  <dd className="mt-1 sm:mt-1.5 text-[14px] sm:text-[15px] text-fg">{m.value}</dd>
                </div>
              ))}
            </dl>
            {topics.length > 0 && (
              <div className="blog-topics">
                <span className="label-mono text-fg-subtle shrink-0">Filed under</span>
                <ul>
                  {topics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </header>

      <div className="blog-shell">
        {!lead ? (
          <section aria-label="No articles yet" className="py-28 sm:py-36 grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8">
              <p className="label-mono text-fg-subtle">Issue 00</p>
              <p className="mt-6 display-md text-fg">
                Writing is <em className="italic text-accent">in progress.</em>
              </p>
              <p className="mt-6 text-fg-muted max-w-[44ch]">
                New technical reflections and architecture notes will appear here once published.
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-16 sm:gap-24 lg:gap-28 mt-10 sm:mt-16 lg:mt-20">
            <section aria-label={lead.featured ? "Featured article" : "Latest article"}>
              <LeadStory post={lead} featured={lead.featured} />
            </section>

            {pair.length > 0 && (
              <section aria-label="Recent entries" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-12">
                {pair.map((p, i) => (
                  <Reveal key={p._id || p.slug} delay={i * 0.08}>
                    <PairStory post={p} />
                  </Reveal>
                ))}
              </section>
            )}

            {archive.length > 0 && (
              <section aria-labelledby="archive-title">
                <div className="flex items-baseline justify-between gap-4 pb-3 sm:pb-4 border-b border-line-strong">
                  <h2 id="archive-title" className="font-display text-[clamp(1.75rem,6vw,2.75rem)] leading-none text-fg">
                    The <em className="italic text-accent">archive</em>
                  </h2>
                  <span className="label-mono text-fg-subtle shrink-0">
                    {archive.length} {archive.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <ol>
                  {archive.map((p, i) => (
                    <li key={p._id || p.slug} className="border-b border-line">
                      {/* phones: number + text; md+: number, title and excerpt, date, thumbnail */}
                      <Link
                        href={`/blog/${p.slug}`}
                        className="group grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2.5rem_minmax(0,1fr)_9rem_9.5rem] lg:grid-cols-[2.75rem_minmax(0,1fr)_10rem_11rem] gap-x-3 md:gap-x-6 lg:gap-x-8 gap-y-2 py-5 sm:py-7 md:items-center"
                      >
                        <span className="blog-ice font-mono text-[11px] pt-1.5 md:pt-0 md:self-start md:mt-2">
                          {String(archiveStart + i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h3 className="blog-row-title font-display text-fg transition-transform duration-500 group-hover:translate-x-1 group-hover:italic">
                            {p.title}
                          </h3>
                          {p.excerpt && <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted line-clamp-2 max-w-[64ch]">{p.excerpt}</p>}
                        </div>
                        <Meta post={p} stacked className="col-start-2 md:col-start-auto md:flex-col md:items-start md:gap-y-1" />
                        <div className="hidden md:block">
                          <ArticleCover post={p} scale="sm" sizes="180px" className="w-full aspect-[16/10] rounded-xl border border-line" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

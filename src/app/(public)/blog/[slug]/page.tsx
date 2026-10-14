import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPostBySlug, getPublishedPosts } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MaskText from "@/components/system/MaskText";
import ArticleCover from "@/components/blog/ArticleCover";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ArticleContents from "@/components/blog/ArticleContents";
import EditorialFigure from "@/components/blog/EditorialFigure";
import { resolveMotif } from "@/components/blog/motifs";
import { formatPostDate, formatReadTime } from "@/components/blog/format";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

/** The page header already sets the title; drop a leading Markdown H1 that merely repeats it. */
function withoutRepeatedTitle(content: string, title: string) {
  const m = content.match(/^\s*#\s+(.+?)[ \t]*(?:\r?\n|$)/);
  if (!m) return content;
  const norm = (t: string) => t.replace(/[*_`]/g, "").trim().toLowerCase();
  return norm(m[1]) === norm(title) ? content.slice(m[0].length) : content;
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, false);

  if (!post) {
    return {
      title: "Article Not Found | RAWIN 3.0",
      description: "The requested article does not exist or is not published.",
    };
  }

  const authorName = post.author && post.author.trim() ? post.author.trim() : null;

  return {
    title: authorName ? `${post.title} | ${authorName}` : `${post.title} | RAWIN`,
    description: post.excerpt || `Technical article on ${post.tags.join(", ")}${authorName ? ` by ${authorName}` : ""}.`,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([getPostBySlug(slug, false), getPublishedPosts()]);

  if (!post || post.status !== "published") {
    notFound();
  }

  const idx = posts.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? posts[idx - 1] : null;
  const older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
  const author = post.author?.trim();

  const filed = post.category || post.tags[0] || "Dev log";
  const motif = resolveMotif(post);
  const meta = [
    { label: "Written by", value: author || "RAWIN" },
    { label: "Published", value: <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, "long")}</time> },
    { label: "Reading", value: formatReadTime(post.readTime) },
    { label: "Filed", value: filed },
  ];
  const tagList = (className: string) =>
    post.tags.length > 0 && (
      <ul className={`article-tags ${className}`} aria-label="Article tags">
        {post.tags.map((tag) => (
          <li key={tag}>#{tag}</li>
        ))}
      </ul>
    );

  return (
    <article className="blog-scope flex flex-col" aria-labelledby="article-title">
      <ReadingProgress targetId="article-body" />

      {/* One reading grid for the whole article (see .article-grid). Desktop: a context column
          (back link, category, metadata, then tags in the rail) beside a ~780px reading column
          that carries the title, standfirst, body and next entries; the cover spans both, so the
          whole composition is centred and both columns are used from the first line down.
          Phones and tablets: a single column, metadata as a compact row under the standfirst. */}
      <div className="article-shell">
        <div className="article-grid">
          <nav aria-label="Return to blog" className="article-crumb label-mono text-fg-muted">
            <Link href="/blog" className="group inline-flex items-center gap-2 hover:text-fg transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>The Dev Log</span>
            </Link>
            <span className="flex items-center gap-3">
              {post.featured && <span className="blog-ice">Featured</span>}
              {post.category && <span className="text-accent">{post.category}</span>}
            </span>
          </nav>

          <header className="article-head">
            <MaskText as="h1" id="article-title" immediate className="article-title font-display text-fg" lines={[post.title]} />
            {post.excerpt && <p className="article-standfirst font-display italic">{post.excerpt}</p>}
          </header>

          <dl className="article-meta">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="label-mono text-fg-subtle">{m.label}</dt>
                <dd className="text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>

          <ArticleCover
            post={post}
            priority
            scale="lg"
            sizes="(min-width: 1280px) 1080px, 100vw"
            className="article-cover w-full rounded-[20px] sm:rounded-[28px] border border-line shadow-[var(--shadow-2)]"
          />

          {/* Desktop rail */}
          <aside className="article-rail hidden lg:block" aria-label="Article topics">
            <div className="sticky top-28 flex flex-col gap-7">
              <ArticleContents bodyId="article-body" variant="rail" />
              <div>
                <p className="label-mono text-fg-subtle mb-3">Filed under</p>
                {tagList("")}
              </div>
              <Link href="/blog" className="group inline-flex items-center gap-2 text-sm text-fg">
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span className="link-draw">All entries</span>
              </Link>
            </div>
          </aside>

          <section id="article-body" aria-label="Article content" className="article-body min-w-0">
            <div className="lg:hidden">
              <ArticleContents bodyId="article-body" variant="inline" />
            </div>
            <MarkdownRenderer
              content={withoutRepeatedTitle(post.content, post.title)}
              figure={motif ? <EditorialFigure motif={motif} caption={post.illustrationCaption} /> : undefined}
            />

            {/* the rail carries the tags on desktop; phones and tablets show them here */}
            <div className="lg:hidden">{tagList("mt-8")}</div>

            <footer className="article-end flex items-center justify-between gap-4">
              <p className="text-sm text-fg-muted">
                {author ? (
                  <>
                    Written by <span className="text-fg">{author}</span>
                  </>
                ) : (
                  "RAWIN · Dev Log"
                )}
              </p>
              <span aria-hidden="true" className="text-accent">✦</span>
            </footer>

            {/* Adjacent entries: the close of the reading column */}
            {(newer || older) && (
              <nav aria-label="More articles" className="article-next">
                {[
                  { post: older, label: "Previous entry" },
                  { post: newer, label: "Next entry" },
                ]
                  .filter((e) => e.post)
                  .map(({ post: p, label }) => (
                    <Link
                      key={label}
                      href={`/blog/${p!.slug}`}
                      className="group flex flex-col gap-3 rounded-[20px] border border-line bg-surface/40 hover:bg-surface hover:border-line-strong p-5 sm:p-6 transition-colors"
                    >
                      <span className="label-mono text-fg-subtle">{label}</span>
                      <span className="font-display text-[clamp(1.3rem,4.6vw,1.65rem)] leading-[1.08] tracking-[-0.015em] text-fg group-hover:italic [text-wrap:balance]">
                        {p!.title}
                      </span>
                      <span className="mt-auto inline-flex items-center gap-2 text-sm text-fg-muted">
                        {formatReadTime(p!.readTime)}
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
                      </span>
                    </Link>
                  ))}
              </nav>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, BookOpen } from "lucide-react";
import { getPostBySlug } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0;

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
    openGraph: {
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

function formatDateLong(dateStr?: string): string {
  if (!dateStr) return "Published";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, false);

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <article className="w-full max-w-5xl mx-auto pt-32 sm:pt-36 lg:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">

      {/* ─── Back navigation ─── */}
      <nav aria-label="Return to blog">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted/60 hover:text-pacific-cyan transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Articles</span>
        </Link>
      </nav>

      {/* ─── Article header ─── */}
      <header className="flex flex-col gap-5 sm:gap-6 pb-8 border-b border-white/[0.08]">

        {/* Eyebrow row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Architecture Note</span>
          </div>

          {post.featured && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-apricot-cream/10 border border-apricot-cream/20 text-apricot-cream">
              FEATURED
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-foreground font-space leading-[1.2] max-w-4xl">
          {post.title}
        </h1>

        {/* Excerpt / lead */}
        {post.excerpt && (
          <p className="text-base sm:text-lg md:text-xl text-apricot-cream/85 font-medium leading-relaxed max-w-4xl">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted/60 pt-1">
          {post.author && post.author.trim() && (
            <>
              <span className="text-muted/80">
                By <span className="text-foreground/90 font-medium">{post.author.trim()}</span>
              </span>
              <span className="text-white/20" aria-hidden="true">&middot;</span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pacific-cyan/60" />
            {formatDateLong(post.publishedAt)}
          </span>
          <span className="text-white/20" aria-hidden="true">&middot;</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-pacific-cyan/60" />
            {post.readTime}
          </span>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Article tags">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded text-xs font-mono text-pacific-cyan/80 bg-pacific-cyan/[0.07] border border-pacific-cyan/15"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Cover image */}
        {post.coverImage && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] max-h-[440px] mt-2 bg-ink-black/60">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            {/* Subtle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.4)] to-transparent pointer-events-none" />
          </div>
        )}
      </header>

      {/* ─── Markdown body ─── */}
      <section aria-label="Article content" className="py-2 w-full">
        <MarkdownRenderer content={post.content} />
      </section>

      {/* ─── Footer strip ─── */}
      <footer className="pt-8 sm:pt-10 border-t border-white/[0.08] flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          {post.author && post.author.trim() && (
            <p className="text-xs sm:text-sm font-mono text-muted/80 tracking-wide truncate">
              Written by <span className="text-foreground/90 font-medium">{post.author.trim()}</span>
            </p>
          )}
          <div className="text-[11px] font-mono text-muted/40 tracking-wider uppercase">
            RAWIN &middot; DEV LOG
          </div>
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted/60 hover:text-pacific-cyan transition-colors group shrink-0 ml-auto"
          aria-label="Return to blog articles"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Return</span>
        </Link>
      </footer>
    </article>
  );
}

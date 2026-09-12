export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "engineering-60fps-web-experiences",
    title: "Engineering Silky 60 FPS Web Experiences: Beyond Basic CSS Transforms",
    excerpt:
      "A deep dive into browser composite layers, avoiding layout reflows, and throttling high-frequency pointer events with requestAnimationFrame.",
    date: "Sep 2026",
    readTime: "5 min read",
    tags: ["Performance", "CSS", "Browser Internals"],
    featured: true,
  },
  {
    id: "2",
    slug: "nextjs-server-components-architecture",
    title: "Architectural Patterns for Next.js Server Components and Edge Streaming",
    excerpt:
      "Balancing client-side interactivity with server-rendered data fetching to eliminate client JavaScript bundle bloat.",
    date: "Aug 2026",
    readTime: "7 min read",
    tags: ["Next.js", "Architecture", "TypeScript"],
    featured: true,
  },
  {
    id: "3",
    slug: "design-systems-that-dont-break",
    title: "Building Design Systems That Don't Break in Production",
    excerpt:
      "How to set up strict design tokens with Tailwind CSS v4, maintain typographic rhythm, and avoid inconsistent ad-hoc styling.",
    date: "Jul 2026",
    readTime: "4 min read",
    tags: ["Design Systems", "Tailwind CSS", "UI/UX"],
  },
  {
    id: "4",
    slug: "cloudflare-workers-ai-edge-inference",
    title: "Zero-Cold-Start AI Inference on Cloudflare Workers",
    excerpt:
      "Embedding private, low-latency LLM responses into client interfaces without paying hefty external API markups.",
    date: "Jun 2026",
    readTime: "6 min read",
    tags: ["Cloudflare", "AI", "Serverless"],
  },
];

export interface TechItem {
  name: string;
  level: "Advanced" | "Proficient" | "Specialized";
  description: string;
  highlight?: boolean;
}

export interface TechCategory {
  title: string;
  badge: string;
  description: string;
  items: TechItem[];
}

export const TECH_ARSENAL: TechCategory[] = [
  {
    title: "Frontend Engineering",
    badge: "Client-Side",
    description: "Building responsive interfaces with fluid interactions and clean component architecture.",
    items: [
      { name: "Next.js 15 (App Router)", level: "Advanced", description: "SSR, SSG, Server Components, Streaming", highlight: true },
      { name: "React 19 / 18", level: "Advanced", description: "Custom hooks, concurrency, component state architecture", highlight: true },
      { name: "TypeScript", level: "Advanced", description: "Strict typing, generics, interfaces, scalable codebases", highlight: true },
      { name: "Tailwind CSS", level: "Advanced", description: "Design systems, utility architecture, zero runtime overhead", highlight: true },
      { name: "Framer Motion", level: "Proficient", description: "Physics-based animations and transitions" },
      { name: "HTML5 / Modern CSS", level: "Advanced", description: "Semantic markup, CSS variables, grid, flexbox, a11y" },
    ],
  },
  {
    title: "Backend & Services",
    badge: "Server-Side",
    description: "Building reliable API endpoints, server handlers, and application logic.",
    items: [
      { name: "Node.js & Express", level: "Proficient", description: "Event-driven runtime, RESTful routing, middleware" },
      { name: "Serverless & Edge APIs", level: "Proficient", description: "Next.js Route Handlers, Cloudflare Workers", highlight: true },
      { name: "Python", level: "Proficient", description: "Scripting, data automation, back-end utilities" },
      { name: "Authentication & Security", level: "Proficient", description: "JWT, session management, secure headers, CORS" },
      { name: "WebSockets & Real-Time", level: "Proficient", description: "Bi-directional event streaming and live telemetry" },
    ],
  },
  {
    title: "Cloud, AI & Storage",
    badge: "Infrastructure",
    description: "Using modern cloud platforms and serverless functions for fast, reliable deployments.",
    items: [
      { name: "Cloudflare Workers & AI", level: "Specialized", description: "Edge computing, serverless inference, KV storage", highlight: true },
      { name: "PostgreSQL & Supabase", level: "Proficient", description: "Relational modeling, SQL indexing, connection pooling" },
      { name: "MongoDB", level: "Proficient", description: "Document-oriented schemas and high-throughput ingestion" },
      { name: "Vercel & Edge Deployment", level: "Advanced", description: "CI/CD pipelines, instant rollbacks, edge caching" },
      { name: "Git & Version Control", level: "Advanced", description: "Trunk-based workflows, release tags, collaborative review" },
    ],
  },
  {
    title: "Design & Optimization",
    badge: "Craftsmanship",
    description: "Focusing on visual detail, responsiveness, and fast load times.",
    items: [
      { name: "Figma UI/UX Design", level: "Advanced", description: "Design systems, auto-layout, wireframes, prototypes", highlight: true },
      { name: "Web Performance (Core Web Vitals)", level: "Advanced", description: "LCP/INP optimization, tree-shaking, asset compression", highlight: true },
      { name: "Mobile-First Design", level: "Advanced", description: "Adaptive layouts from 320px screens to 4K displays" },
      { name: "SEO & Semantic Web", level: "Proficient", description: "OpenGraph metadata, schema markup, crawlability" },
    ],
  },
];

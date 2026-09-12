/**
 * Database Seed and Migration Script for RAWIN 3.0 Blog Posts.
 * Migrates existing blog post records into MongoDB Atlas rawin3.blogPosts collection.
 * Idempotent: Uses unique slug as key to update or insert without duplicating.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

function normalizeMongoUri(rawUri) {
  let cleaned = (rawUri || '').trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/:<([^>]+)>/, (_match, p1) => `:${p1}`);
}

const rawUri = process.env.MONGODB_URI;
if (!rawUri) {
  console.error('[Blog Seed] Error: MONGODB_URI is not set in .env.local.');
  process.exit(1);
}

const uri = normalizeMongoUri(rawUri);
const dbName = process.env.MONGODB_DB_NAME || 'rawin3';

const INITIAL_BLOG_POSTS = [
  {
    slug: 'engineering-60fps-web-experiences',
    title: 'Engineering Silky 60 FPS Web Experiences: Beyond Basic CSS Transforms',
    excerpt: 'A deep dive into browser composite layers, avoiding layout reflows, and throttling high-frequency pointer events with requestAnimationFrame.',
    content: `# Engineering Silky 60 FPS Web Experiences

Maintaining a solid 60 frames per second on modern web applications requires understanding how browsers turn DOM nodes into pixels on screen. In complex user interfaces with cursor reactivity and dynamic particle systems, small rendering mistakes can trigger cascading frame drops.

## The Critical Rendering Path

When the browser updates a frame, it passes through three stages:

1. **Layout (Reflow)**: Calculates geometric coordinates and sizes for every element.
2. **Paint**: Fills pixels for colors, text, shadows, and borders.
3. **Composite**: Assembles painted layers on the GPU and outputs to the display.

Triggering layout or paint during continuous interactions (such as mouse movement or smooth scrolling) forces the main thread to recalculate hundreds of nodes per frame.

\`\`\`typescript
// Anti-pattern: Reading and writing layout properties in a loop
elements.forEach((el) => {
  const height = el.offsetHeight; // Forces synchronous layout
  el.style.height = (height + 10) + 'px';
});

// Optimized: Partition reads and schedule writes via requestAnimationFrame
requestAnimationFrame(() => {
  elements.forEach((el) => {
    el.style.transform = 'translate3d(0, 10px, 0)';
  });
});
\`\`\`

## Leveraging GPU Composited Properties

To ensure zero-jank interaction, restrict animated properties strictly to **transform** and **opacity**. These bypass both Layout and Paint phases entirely, operating directly on GPU layers.

| Property | Layout Phase | Paint Phase | Composite Phase |
| :--- | :--- | :--- | :--- |
| \`width\` / \`height\` | Triggers | Triggers | Yes |
| \`top\` / \`left\` | Triggers | Triggers | Yes |
| \`transform\` | Skips | Skips | GPU Accelerated |
| \`opacity\` | Skips | Skips | GPU Accelerated |

## Handling High-Frequency Pointer Streams

Browser \`pointermove\` and \`mousemove\` events fire at hardware polling rates (often 120Hz to 1000Hz on gaming mice). Attempting state updates or canvas recalculations on every single event will overwhelm the main thread.

Always decouple input sampling from rendering:

\`\`\`typescript
let pendingX = 0;
let pendingY = 0;
let rafScheduled = false;

window.addEventListener('pointermove', (e) => {
  pendingX = e.clientX;
  pendingY = e.clientY;
  
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(renderFrame);
  }
}, { passive: true });

function renderFrame() {
  rafScheduled = false;
  // Apply transformations using latest captured pointer coordinates
}
\`\`\`

By decoupling input ingestion from the browser refresh cycle, animations remain deterministic, fluid, and battery-friendly.`,
    coverImage: '/images/profile.png',
    tags: ['Performance', 'CSS', 'Browser Internals'],
    readTime: '5 min read',
    status: 'published',
    featured: true,
    publishedAt: new Date('2026-09-01T12:00:00.000Z'),
  },
  {
    slug: 'nextjs-server-components-architecture',
    title: 'Architectural Patterns for Next.js Server Components and Edge Streaming',
    excerpt: 'Balancing client-side interactivity with server-rendered data fetching to eliminate client JavaScript bundle bloat.',
    content: `# Architectural Patterns for Next.js Server Components

Next.js Server Components (RSC) represent a fundamental shift in how full-stack React applications are constructed. Rather than shipping thousands of kilobytes of data-fetching libraries and heavy parser dependencies to the browser, RSC executes directly on the server.

## The Mental Model: Server by Default

In Next.js App Router, every component is a Server Component unless explicitly marked with \`"use client"\`. This inversion offers three major architectural advantages:

- **Zero Bundle Impact**: Dependencies like database drivers, markdown compilers, and cryptographic utilities remain strictly server-side.
- **Direct Backend Access**: Components can query databases directly without requiring REST or GraphQL boilerplate endpoints.
- **Automatic Streaming**: Suspense boundaries allow fast initial page shell rendering while slower data sources stream in progressively.

## Designing the Component Boundary

The most common architectural mistake is placing \`"use client"\` too high in the component tree. Keep client boundaries as leaf nodes:

\`\`\`
[Server Component: Page] (fetches data directly from MongoDB)
  ├── [Server Component: Static Article Header]
  ├── [Client Component: Interactive Category Filter] (manages local active filter)
  └── [Server Component: Article Grid]
\`\`\`

## Handling Dynamic Route Parameters in Next.js 16

In Next.js 15 and 16, route parameters and search parameters are asynchronous promises:

\`\`\`typescript
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    notFound();
  }
  
  return <article>{/* render content */}</article>;
}
\`\`\`

By embracing asynchronous parameters and keeping client components isolated to genuine user interaction zones, applications achieve instant perceived load times and minimal memory footprints.`,
    coverImage: '/images/profile.png',
    tags: ['Next.js', 'Architecture', 'TypeScript'],
    readTime: '7 min read',
    status: 'published',
    featured: true,
    publishedAt: new Date('2026-08-15T10:30:00.000Z'),
  },
  {
    slug: 'design-systems-that-dont-break',
    title: "Building Design Systems That Don't Break in Production",
    excerpt: 'How to set up strict design tokens with Tailwind CSS v4, maintain typographic rhythm, and avoid inconsistent ad-hoc styling.',
    content: `# Building Design Systems That Don't Break in Production

A design system is not just a collection of UI widgets; it is a shared contract between design intent and engineering execution. When design systems fail, it is usually because developers begin introducing ad-hoc utility classes and arbitrary pixel offsets.

## Core Rules for Production Stability

1. **Strict Design Tokens**: Define deliberate color scales, spacing scales, and typography hierarchies in a single configuration file.
2. **Component Encapsulation**: Wrap raw buttons, inputs, and cards into reusable primitives.
3. **Restrained Color Palettes**: Limit accent colors to curated tones. In RAWIN 3.0, we rely on Ink Black (\`#030712\`), Pacific Cyan (\`#189bad\`), and Apricot Cream (\`#fed1a3\`).

## Typographic Hierarchy and Rhythm

Typographic scale must be systematic rather than arbitrary:

\`\`\`css
/* Example Token Hierarchy */
--font-space: 'Space Grotesk', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--color-cyan: #189bad;
--color-apricot: #fed1a3;
\`\`\`

## Avoiding Visual Noise

Glassmorphic surfaces and subtle borders provide depth without adding visual weight. Instead of heavy solid borders, use fractional white borders:

\`\`\`css
border: 1px solid rgba(255, 255, 255, 0.08);
background: rgba(3, 7, 18, 0.7);
backdrop-filter: blur(16px);
\`\`\`

Consistency creates polish. A disciplined design system allows developers to build new interfaces quickly without compromising aesthetic integrity.`,
    coverImage: '/images/profile.png',
    tags: ['Design Systems', 'Tailwind CSS', 'UI/UX'],
    readTime: '4 min read',
    status: 'published',
    featured: false,
    publishedAt: new Date('2026-07-20T14:00:00.000Z'),
  },
  {
    slug: 'cloudflare-workers-ai-edge-inference',
    title: 'Zero-Cold-Start AI Inference on Cloudflare Workers',
    excerpt: 'Embedding private, low-latency LLM responses into client interfaces without paying hefty external API markups.',
    content: `# Zero-Cold-Start AI Inference on Cloudflare Workers

Running generative models and embedding lookups close to the user eliminates traditional round-trip latency to centralized data centers. Edge computing architectures allow developers to serve intelligence with sub-second response times.

## Why Edge Inference Matters

Traditional AI architectures route requests through centralized API gateways:

\`\`\`
Client (Tokyo) -> Central Server (US East) -> AI Provider (US West) -> Response
\`\`\`

With serverless edge workers, compute runs at the nearest Point of Presence (PoP):

\`\`\`
Client (Tokyo) -> Cloudflare Edge PoP (Tokyo) -> Response
\`\`\`

## Architecture Considerations

- **Streaming Responses**: Always stream text tokens via Server-Sent Events (SSE) or ReadableStream to ensure the interface begins rendering within milliseconds.
- **Payload Sanitization**: Never pass raw user input directly to model prompts without validating and escaping delimiter characters.
- **Cost Efficiency**: Use lightweight models for interactive classification and summarization, reserving larger models for deep multi-step synthesis.

Edge deployment transforms latency-sensitive applications from sluggish dashboards into snappy, immediate experiences.`,
    coverImage: '/images/profile.png',
    tags: ['Cloudflare', 'AI', 'Serverless'],
    readTime: '6 min read',
    status: 'published',
    featured: false,
    publishedAt: new Date('2026-06-10T09:15:00.000Z'),
  },
];

async function seedBlog() {
  console.log('[Blog Seed] Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('blogPosts');

    console.log(`[Blog Seed] Connected to database: "${dbName}"`);

    // Ensure unique index on slug
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ status: 1, publishedAt: -1 });
    console.log('[Blog Seed] Verified unique index on slug and query index on status+publishedAt.');

    let upsertedCount = 0;
    let modifiedCount = 0;

    for (const post of INITIAL_BLOG_POSTS) {
      const now = new Date();
      const res = await col.updateOne(
        { slug: post.slug },
        {
          $set: {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            tags: post.tags,
            readTime: post.readTime,
            status: post.status,
            featured: post.featured,
            publishedAt: post.publishedAt,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: post.publishedAt || now,
          },
        },
        { upsert: true }
      );

      if (res.upsertedCount > 0) upsertedCount++;
      if (res.modifiedCount > 0) modifiedCount++;
    }

    console.log(`[Blog Seed] Complete: ${upsertedCount} inserted, ${modifiedCount} updated.`);
    const total = await col.countDocuments();
    console.log(`[Blog Seed] Total articles in collection: ${total}`);
  } catch (err) {
    console.error('[Blog Seed] Error during seed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedBlog();

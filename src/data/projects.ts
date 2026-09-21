export interface ProjectCaseStudy {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  role: string;
  outcome: string;
  featured: boolean;
  category: "Full Stack" | "Frontend" | "AI & Cloud" | "Web App";
  technologies: string[];
  engineeringFocus: string[];
  metrics: { label: string; value: string }[];
  image: string;
  liveUrl?: string;
  githubUrl?: string;
  year: string;
}

export const PROJECTS: ProjectCaseStudy[] = [
  {
    id: "rawin-v3",
    slug: "rawin-v3",
    title: "RAWIN v3.0",
    tagline: "Next-generation developer portfolio & engineering showcase",
    description:
      "A high-performance personal portfolio and digital brand platform engineered with Next.js 15, TypeScript, Tailwind CSS, and hardware-accelerated micro-interactions.",
    problem:
      "Previous static portfolio suffered from heavy CSS bloat (~3,000 lines), unoptimized mobile re-renders, and lacked an interactive project case-study architecture.",
    solution:
      "Re-engineered from the ground up using modern component architecture, Lenis smooth scroll engine, throttled pointer-tracking spotlight with smooth performance, and structured MDX content support.",
    role: "Lead Full Stack Architect & UI Designer",
    outcome:
      "Achieved sub-second page loads, smooth interaction physics, and zero layout shift across all viewport sizes.",
    featured: true,
    category: "Full Stack",
    technologies: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion", "Lenis", "EmailJS"],
    engineeringFocus: ["Performance", "Scalable Architecture", "Product UX"],
    metrics: [],
    image: "/images/profile.png",
    liveUrl: "https://rawin.world",
    githubUrl: "https://github.com/rush627",
    year: "2026",
  },
  {
    id: "strata-commerce",
    slug: "strata-commerce",
    title: "Strata Commerce",
    tagline: "Ultra-fast headless e-commerce experience with sub-100ms transitions",
    description:
      "A full-stack e-commerce experience featuring server-driven inventory synchronization, edge-cached product catalogs, and an instant checkout pipeline.",
    problem:
      "Traditional monolithic shopping cart platforms had high latency on mobile networks and lost conversions due to sluggish product filtering.",
    solution:
      "Built a modern headless frontend leveraging Next.js server components, optimistic UI cart updates, and instant search with fuzzy match indexing.",
    role: "Full Stack Developer",
    outcome:
      "Reduced average page transition times and increased user checkout completion rates significantly.",
    featured: true,
    category: "Full Stack",
    technologies: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "Stripe API"],
    engineeringFocus: ["Edge Caching", "Optimistic UI", "Reliable Pipelines"],
    metrics: [],
    image: "/images/profile.png",
    liveUrl: "https://github.com/rush627",
    githubUrl: "https://github.com/rush627",
    year: "2025",
  },
  {
    id: "rawin-horizon",
    slug: "rawin-horizon",
    title: "Rawin Horizon",
    tagline: "Telemetry dashboard & streaming event visualization",
    description:
      "An interactive real-time observability dashboard for monitoring microservices, WebSocket events, and live throughput metrics.",
    problem:
      "Engineers lacked an intuitive, lightweight visualizer to inspect streaming operational metrics without launching heavy enterprise suites.",
    solution:
      "Developed a dark-mode first telemetry interface with WebSockets, SVG sparklines, canvas heatmaps, and customizable monitoring widgets.",
    role: "Frontend Engineer & UI Architect",
    outcome:
      "Capable of rendering streaming operational data points with zero UI frame dropping.",
    featured: true,
    category: "Web App",
    technologies: ["TypeScript", "React", "WebSockets", "Tailwind CSS", "Canvas API"],
    engineeringFocus: ["Live Telemetry", "Canvas Rendering", "Low Overhead"],
    metrics: [],
    image: "/images/profile.png",
    liveUrl: "https://github.com/rush627",
    githubUrl: "https://github.com/rush627",
    year: "2025",
  },
  {
    id: "rawin-orbit",
    slug: "rawin-orbit",
    title: "Rawin Orbit",
    tagline: "Intelligent conversational system powered by Cloudflare Workers AI and dynamic portfolio knowledge",
    description:
      "A specialized AI intelligence system built for RAWIN, utilizing edge LLMs for zero-cold-start natural language responses and deep portfolio grounding.",
    problem:
      "Standard client-side chat widgets are heavy, sluggish, and often rely on expensive or rate-limited external APIs.",
    solution:
      "Integrated Cloudflare Workers AI with serverless streaming edge functions, client-side session memory, and an orbital interface.",
    role: "Full Stack Engineer",
    outcome:
      "Zero server maintenance, fast edge inference, and private session management.",
    featured: false,
    category: "AI & Cloud",
    technologies: ["Cloudflare AI", "Next.js", "TypeScript", "Edge Workers", "Tailwind CSS"],
    engineeringFocus: ["Edge Inference", "Stream Parsing", "Session Privacy"],
    metrics: [],
    image: "/images/profile.png",
    liveUrl: "/ai",
    githubUrl: "https://github.com/rush627",
    year: "2026",
  },
];

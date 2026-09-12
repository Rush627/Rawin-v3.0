export interface TimelineItem {
  period: string;
  role: string;
  companyOrContext: string;
  description: string;
  highlights: string[];
}

export interface ValueProposition {
  title: string;
  tagline: string;
  description: string;
  metric: string;
}

export const TIMELINE: TimelineItem[] = [
  {
    period: "2024 - Present",
    role: "Full Stack Engineer & Independent Builder",
    companyOrContext: "RAWIN / Independent Projects",
    description:
      "Building full-stack web applications with Next.js, TypeScript, and modern backend services. Focused on responsive layouts, clean code, and reliable API routes.",
    highlights: [
      "Built responsive web applications with Next.js and TypeScript",
      "Integrated serverless APIs and interactive UI components",
      "Designed modular component systems with Tailwind CSS",
    ],
  },
  {
    period: "2022 - 2023",
    role: "Frontend Developer & UI Craftsman",
    companyOrContext: "Client Collaborations & Freelance",
    description:
      "Built custom websites and client web interfaces with responsive layouts, clean typography, and subtle interactions.",
    highlights: [
      "Turned Figma designs into responsive, accessible web pages",
      "Optimized frontend assets and page load times",
      "Collaborated with clients to deliver projects on schedule",
    ],
  },
  {
    period: "2020 - 2022",
    role: "Web Developer & Interface Designer",
    companyOrContext: "Early Practice & Foundation",
    description:
      "Built foundational skills across HTML, CSS, JavaScript, and responsive design through hands-on personal and community projects.",
    highlights: [
      "Created interactive landing pages and reusable component templates",
      "Practiced modern CSS layouts, responsive grids, and DOM scripting",
    ],
  },
];

export const VALUE_PROPOSITIONS: ValueProposition[] = [
  {
    title: "Performance First",
    tagline: "Speed is a core user feature",
    description:
      "Every byte and millisecond counts. Code is systematically tree-shaken, assets are optimized, and transitions run smoothly without jank or memory leaks.",
    metric: "01",
  },
  {
    title: "Design With Purpose",
    tagline: "Design sensitivity meets technical depth",
    description:
      "I think in both design tokens and database schemas. You get pixel-perfect aesthetic precision backed by scalable, type-safe API architectures.",
    metric: "02",
  },
  {
    title: "Production Mindset",
    tagline: "Code that lives comfortably in production",
    description:
      "Strict TypeScript, semantic markup, accessible focus flows, mobile-first responsiveness, and structured error boundaries come standard.",
    metric: "03",
  },
  {
    title: "Clear Collaboration",
    tagline: "No guesswork or black-box development",
    description:
      "Clear communication, regular milestone previews, organized repository commits, and zero unexpected technical debt.",
    metric: "04",
  },
];

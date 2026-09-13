import type { Metadata } from "next";
import {
  Code2,
  Bot,
  Terminal,
  Globe,
  Palette,
  GitBranch,
  Layers,
  Cpu,
  Database,
  Zap,
  Compass,
  Laptop,
  Flame,
  Activity,
  Sparkles,
  ArrowRight,
  Workflow,
  Radio,
} from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import BorderGlow from "@/components/BorderGlow";

export const metadata: Metadata = {
  title: "What I Use | Rushan Siddiqui",
  description:
    "The tools, software, engineering stack, and personal workflow used daily by Rushan Siddiqui.",
};

export const revalidate = 0;

interface DailyTool {
  name: string;
  category: string;
  description: string;
  icon: typeof Code2;
}

const DAILY_STACK: DailyTool[] = [
  {
    name: "VS Code",
    category: "Editor",
    description: "Primary editor for everyday development.",
    icon: Code2,
  },
  {
    name: "Antigravity",
    category: "AI & Workspace",
    description: "AI-assisted development, project exploration, and rapid iteration.",
    icon: Bot,
  },
  {
    name: "Windows Terminal / PowerShell",
    category: "Terminal",
    description: "Git, npm, scripts, system tasks, and project automation.",
    icon: Terminal,
  },
  {
    name: "Chrome",
    category: "Browser",
    description: "Responsive testing, DevTools, debugging, and research.",
    icon: Globe,
  },
  {
    name: "Figma",
    category: "Design",
    description: "UI exploration, layouts, visual systems, and prototypes.",
    icon: Palette,
  },
  {
    name: "Git / GitHub",
    category: "Version Control",
    description: "Version control, project history, and collaboration.",
    icon: GitBranch,
  },
];

const ICON_MAP: Record<string, typeof Layers> = {
  layers: Layers,
  code: Code2,
  cpu: Cpu,
  palette: Palette,
  database: Database,
  zap: Zap,
  activity: Activity,
  compass: Compass,
  git: GitBranch,
  terminal: Terminal,
  bot: Bot,
  globe: Globe,
  sparkles: Sparkles,
  radio: Radio,
  flame: Flame,
  laptop: Laptop,
  workflow: Workflow,
};

function resolveIcon(identifier?: string, fallback: typeof Layers = Layers) {
  if (!identifier) return fallback;
  const key = identifier.toLowerCase().trim();
  return ICON_MAP[key] || fallback;
}

const DEFAULT_DEV_STACK = [
  {
    name: "Next.js",
    category: "Framework",
    description: "Application architecture, routing, server rendering, and APIs.",
    icon: "layers",
    displayOrder: 1,
  },
  {
    name: "React",
    category: "UI Library",
    description: "Reusable interfaces and interactive components.",
    icon: "code",
    displayOrder: 2,
  },
  {
    name: "TypeScript",
    category: "Language",
    description: "Typed application logic and safer component development.",
    icon: "cpu",
    displayOrder: 3,
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    description: "Responsive styling and reusable design patterns.",
    icon: "palette",
    displayOrder: 4,
  },
  {
    name: "MongoDB",
    category: "Database",
    description: "Portfolio, project, blog, and CMS data.",
    icon: "database",
    displayOrder: 5,
  },
  {
    name: "Framer Motion",
    category: "Animation",
    description: "Interface motion and micro-interactions.",
    icon: "zap",
    displayOrder: 6,
  },
  {
    name: "Lenis",
    category: "Scroll",
    description: "Smooth scrolling and scroll-driven experiences.",
    icon: "activity",
    displayOrder: 7,
  },
  {
    name: "Cloudflare Workers / AI",
    category: "Edge Compute",
    description: "Experiments with edge functions and AI workloads.",
    icon: "compass",
    displayOrder: 8,
  },
  {
    name: "Git / GitHub",
    category: "Source Control",
    description: "Version control, project history, and collaboration.",
    icon: "git",
    displayOrder: 9,
  },
];

interface BuildStep {
  step: string;
  title: string;
  description: string;
}

const BUILD_STEPS: BuildStep[] = [
  {
    step: "01",
    title: "Explore",
    description: "Break down the problem and research what matters.",
  },
  {
    step: "02",
    title: "Design",
    description: "Shape the interface before adding unnecessary complexity.",
  },
  {
    step: "03",
    title: "Build",
    description: "Turn the system into reusable, maintainable components.",
  },
  {
    step: "04",
    title: "Refine",
    description: "Test interaction, responsiveness, accessibility, and performance.",
  },
  {
    step: "05",
    title: "Ship",
    description: "Deploy, observe, iterate, and improve.",
  },
];

const DEFAULT_EXPLORING_TOPICS = [
  {
    name: "Edge AI",
    category: "Inference",
    description: "Running smaller models closer to users with zero cold starts.",
    icon: "compass",
    displayOrder: 1,
  },
  {
    name: "Cloudflare Workers",
    category: "Serverless",
    description: "Global edge functions, distributed storage, and serverless compute.",
    icon: "compass",
    displayOrder: 2,
  },
  {
    name: "WebGPU",
    category: "Graphics",
    description: "Hardware-accelerated graphics pipelines and fluid in-browser rendering.",
    icon: "compass",
    displayOrder: 3,
  },
  {
    name: "Advanced Next.js",
    category: "Architecture",
    description: "Server actions, cache control primitives, and streaming pipelines.",
    icon: "compass",
    displayOrder: 4,
  },
  {
    name: "Motion & Interaction Design",
    category: "Interface",
    description: "Tactile physics, micro-interactions, and 60 FPS compositor smoothness.",
    icon: "compass",
    displayOrder: 5,
  },
];

export default async function UsesPage() {
  const content = await getSiteContent();
  const uses = content.uses;

  const updatedYear = uses?.updatedYear || "2026";

  const devStackItems = (
    uses?.developmentStack && uses.developmentStack.length > 0
      ? [...uses.developmentStack]
      : DEFAULT_DEV_STACK
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const exploringItems = (
    uses?.currentlyExploring && uses.currentlyExploring.length > 0
      ? [...uses.currentlyExploring]
      : DEFAULT_EXPLORING_TOPICS
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const mySetup = {
    mainMachine: {
      label: uses?.mySetup?.mainMachine?.label || "Main machine",
      value: uses?.mySetup?.mainMachine?.value || "Windows PC",
      description:
        uses?.mySetup?.mainMachine?.description ||
        "Workstation configured for daily development.",
    },
    fuel: {
      label: uses?.mySetup?.fuel?.label || "Fuel",
      value:
        uses?.mySetup?.fuel?.value || "Passion to build something worth showing.",
      description:
        uses?.mySetup?.fuel?.description ||
        "Curiosity and focused craftsmanship driving every commit.",
    },
    currentStatus: {
      label: uses?.mySetup?.currentStatus?.label || "Current status",
      value: uses?.mySetup?.currentStatus?.value || "Probably coding.",
      description:
        uses?.mySetup?.currentStatus?.description ||
        "In editor tabs, components, or edge deployments.",
    },
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Top ambient backdrop to ensure content scrolls smoothly behind the floating navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-ink-black via-ink-black/85 to-transparent z-40"
      />

      <div className="w-full max-w-5xl mx-auto pt-32 sm:pt-36 md:pt-40 pb-24 px-4 sm:px-6 flex flex-col gap-20">
        {/* Section 1: Hero */}
        <section className="flex flex-col gap-5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{uses?.eyebrow || "Tools & Hardware"}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.08]">
              {`Updated regularly · ${updatedYear}`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground font-space leading-tight">
            What I <span className="text-pacific-cyan">Use</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed font-sans max-w-2xl">
            {uses?.description && !uses.description.includes("high-performance")
              ? uses.description
              : "The tools, software, and workflows I actually reach for when building, designing, debugging, and shipping."}
          </p>
        </section>

        {/* Section 2: Daily Stack */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-space flex items-center gap-2.5">
              <Laptop className="w-5 h-5 text-pacific-cyan" />
              Daily Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAILY_STACK.map((tool) => {
              const Icon = tool.icon;
              return (
                <BorderGlow key={tool.name} borderRadius={12} className="h-full">
                  <div
                    className="group relative rounded-xl p-5 bg-[rgba(22,22,34,0.45)] border border-white/[0.06] hover:border-pacific-cyan/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.5),0_0_20px_rgba(24,155,173,0.06)] flex flex-col gap-3 h-full"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] group-hover:bg-pacific-cyan/10 border border-white/[0.08] group-hover:border-pacific-cyan/30 flex items-center justify-center text-pacific-cyan transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-muted/60 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                        {tool.category}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <h3 className="text-base font-bold font-space text-foreground group-hover:text-pacific-cyan transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted/80 leading-relaxed font-sans">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </BorderGlow>
              );
            })}
          </div>
        </section>

        {/* Section 3: Development Stack */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-space flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-pacific-cyan" />
              Development Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {devStackItems.map((tech) => {
              const Icon = resolveIcon(tech.icon, Layers);
              return (
                <BorderGlow key={tech.name} borderRadius={12} className="h-full">
                  <div
                    className="rounded-xl p-4 bg-ink-black/40 border border-white/[0.06] hover:border-pacific-cyan/25 transition-all duration-200 flex flex-col gap-2.5 h-full"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-pacific-cyan/80 shrink-0" />
                        <span className="text-sm font-bold font-space text-foreground truncate">
                          {tech.name}
                        </span>
                      </div>
                      {tech.category && (
                        <span className="text-[10px] font-mono text-pacific-cyan/70 bg-pacific-cyan/[0.06] border border-pacific-cyan/15 px-1.5 py-0.5 rounded shrink-0">
                          {tech.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted/80 leading-relaxed">
                      {tech.description}
                    </p>
                  </div>
                </BorderGlow>
              );
            })}
          </div>
        </section>

        {/* Section 4: How I Build */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-space flex items-center gap-2.5">
              <Workflow className="w-5 h-5 text-pacific-cyan" />
              How I Build
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {BUILD_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-xl p-4 sm:p-5 bg-[rgba(22,22,34,0.35)] border border-white/[0.06] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-pacific-cyan px-2 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/20">
                    {item.step}
                  </span>
                  {idx < BUILD_STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block w-3.5 h-3.5 text-muted/30 -mr-1" />
                  )}
                </div>
                <h3 className="text-base font-bold font-space text-foreground mt-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted/80 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: My Setup */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-space flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-pacific-cyan" />
              My Setup
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Main machine */}
            <div className="rounded-xl p-5 bg-[rgba(22,22,34,0.45)] border border-white/[0.06] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted/60 text-xs font-mono uppercase">
                <Laptop className="w-3.5 h-3.5 text-pacific-cyan" />
                <span>{mySetup.mainMachine.label}</span>
              </div>
              <span className="text-xl font-bold font-space text-foreground">
                {mySetup.mainMachine.value}
              </span>
              {mySetup.mainMachine.description && (
                <p className="text-xs text-muted/70 mt-0.5">
                  {mySetup.mainMachine.description}
                </p>
              )}
            </div>

            {/* Card 2: Fuel */}
            <div className="rounded-xl p-5 bg-[rgba(22,22,34,0.45)] border border-white/[0.06] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted/60 text-xs font-mono uppercase">
                <Flame className="w-3.5 h-3.5 text-apricot-cream" />
                <span>{mySetup.fuel.label}</span>
              </div>
              <span className="text-lg sm:text-base md:text-lg font-bold font-space text-foreground leading-snug">
                {mySetup.fuel.value}
              </span>
              {mySetup.fuel.description && (
                <p className="text-xs text-muted/70 mt-0.5">
                  {mySetup.fuel.description}
                </p>
              )}
            </div>

            {/* Card 3: Current status */}
            <div className="rounded-xl p-5 bg-[rgba(22,22,34,0.45)] border border-white/[0.06] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted/60 text-xs font-mono uppercase">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>{mySetup.currentStatus.label}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xl font-bold font-space text-emerald-300">
                  {mySetup.currentStatus.value}
                </span>
              </div>
              {mySetup.currentStatus.description && (
                <p className="text-xs text-muted/70 mt-0.5">
                  {mySetup.currentStatus.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Currently Exploring */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-space flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-pacific-cyan" />
              Currently Exploring
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {exploringItems.map((topic) => {
              const Icon = resolveIcon(topic.icon, Compass);
              return (
                <div
                  key={topic.name}
                  className="rounded-xl p-4 bg-ink-black/40 border border-white/[0.06] hover:border-pacific-cyan/25 transition-all duration-200 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {topic.icon && <Icon className="w-3.5 h-3.5 text-apricot-cream/80 shrink-0" />}
                      <span className="text-sm font-bold font-space text-foreground truncate">
                        {topic.name}
                      </span>
                    </div>
                    {topic.category && (
                      <span className="text-[10px] font-mono text-apricot-cream/70 bg-apricot-cream/[0.06] border border-apricot-cream/15 px-1.5 py-0.5 rounded shrink-0">
                        {topic.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted/80 leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

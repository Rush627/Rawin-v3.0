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
  Radio,
  Workflow,
  Wrench,
  Boxes,
} from "lucide-react";
import { getSiteContent, type DailyStackItem, type DevStackItem, type BuildStepItem, type ExploringItem } from "@/lib/site-content";
import MobileUsesView from "@/components/MobileUsesView";

export const metadata: Metadata = {
  title: "What I Use | Rushan Siddiqui",
  description:
    "The tools, software, engineering stack, and personal workflow used daily by Rushan Siddiqui.",
};

export const revalidate = 0;

const DEFAULT_DAILY_STACK: DailyStackItem[] = [
  {
    id: "tool-vscode",
    name: "VS Code",
    category: "Editor",
    description: "Primary editor for everyday development.",
    icon: "code",
    order: 1,
    enabled: true,
  },
  {
    id: "tool-antigravity",
    name: "Antigravity",
    category: "AI & Workspace",
    description: "AI-assisted development, project exploration, and rapid iteration.",
    icon: "bot",
    order: 2,
    enabled: true,
  },
  {
    id: "tool-terminal",
    name: "Windows Terminal / PowerShell",
    category: "Terminal",
    description: "Git, npm, scripts, system tasks, and project automation.",
    icon: "terminal",
    order: 3,
    enabled: true,
  },
  {
    id: "tool-chrome",
    name: "Chrome",
    category: "Browser",
    description: "Responsive testing, DevTools, debugging, and research.",
    icon: "globe",
    order: 4,
    enabled: true,
  },
  {
    id: "tool-figma",
    name: "Figma",
    category: "Design",
    description: "UI exploration, layouts, visual systems, and prototypes.",
    icon: "palette",
    order: 5,
    enabled: true,
  },
  {
    id: "tool-git",
    name: "Git / GitHub",
    category: "Version Control",
    description: "Version control, project history, and collaboration.",
    icon: "git",
    order: 6,
    enabled: true,
  },
];

const DEFAULT_DEV_STACK: DevStackItem[] = [
  {
    id: "tech-nextjs",
    name: "Next.js",
    category: "Framework",
    group: "Core Architecture",
    description: "Application architecture, routing, server rendering, and APIs.",
    icon: "layers",
    displayOrder: 1,
    enabled: true,
  },
  {
    id: "tech-react",
    name: "React",
    category: "UI Library",
    group: "Core Architecture",
    description: "Reusable interfaces and interactive components.",
    icon: "code",
    displayOrder: 2,
    enabled: true,
  },
  {
    id: "tech-ts",
    name: "TypeScript",
    category: "Language",
    group: "Core Architecture",
    description: "Typed application logic and safer component development.",
    icon: "cpu",
    displayOrder: 3,
    enabled: true,
  },
  {
    id: "tech-tailwind",
    name: "Tailwind CSS",
    category: "Styling",
    group: "Core Architecture",
    description: "Responsive styling and reusable design patterns.",
    icon: "palette",
    displayOrder: 4,
    enabled: true,
  },
  {
    id: "tech-mongodb",
    name: "MongoDB",
    category: "Database",
    group: "Data & Infrastructure",
    description: "Portfolio, project, blog, and CMS data.",
    icon: "database",
    displayOrder: 5,
    enabled: true,
  },
  {
    id: "tech-framer",
    name: "Framer Motion",
    category: "Animation",
    group: "Motion & Interface",
    description: "Interface motion and micro-interactions.",
    icon: "zap",
    displayOrder: 6,
    enabled: true,
  },
  {
    id: "tech-lenis",
    name: "Lenis",
    category: "Scroll",
    group: "Motion & Interface",
    description: "Smooth scrolling and scroll-driven experiences.",
    icon: "activity",
    displayOrder: 7,
    enabled: true,
  },
  {
    id: "tech-cloudflare",
    name: "Cloudflare Workers / AI",
    category: "Edge Compute",
    group: "Data & Infrastructure",
    description: "Experiments with edge functions and AI workloads.",
    icon: "compass",
    displayOrder: 8,
    enabled: true,
  },
  {
    id: "tech-git",
    name: "Git / GitHub",
    category: "Source Control",
    group: "Version Control",
    description: "Version control, project history, and collaboration.",
    icon: "git",
    displayOrder: 9,
    enabled: true,
  },
];

const DEFAULT_BUILD_STEPS: BuildStepItem[] = [
  {
    id: "step-1",
    step: "01",
    number: "01",
    title: "Explore",
    description: "Break down the problem and research what matters.",
    order: 1,
    enabled: true,
  },
  {
    id: "step-2",
    step: "02",
    number: "02",
    title: "Design",
    description: "Shape the interface before adding unnecessary complexity.",
    order: 2,
    enabled: true,
  },
  {
    id: "step-3",
    step: "03",
    number: "03",
    title: "Build",
    description: "Turn the system into reusable, maintainable components.",
    order: 3,
    enabled: true,
  },
  {
    id: "step-4",
    step: "04",
    number: "04",
    title: "Refine",
    description: "Test interaction, responsiveness, accessibility, and performance.",
    order: 4,
    enabled: true,
  },
  {
    id: "step-5",
    step: "05",
    number: "05",
    title: "Ship",
    description: "Deploy, observe, iterate, and improve.",
    order: 5,
    enabled: true,
  },
];

const DEFAULT_EXPLORING: ExploringItem[] = [
  {
    id: "topic-1",
    name: "Edge AI",
    category: "Inference",
    description: "Running smaller models closer to users with zero cold starts.",
    icon: "compass",
    displayOrder: 1,
    enabled: true,
  },
  {
    id: "topic-2",
    name: "Cloudflare Workers",
    category: "Serverless",
    description: "Global edge functions, distributed storage, and serverless compute.",
    icon: "compass",
    displayOrder: 2,
    enabled: true,
  },
  {
    id: "topic-3",
    name: "WebGPU",
    category: "Graphics",
    description: "Hardware-accelerated graphics pipelines and fluid in-browser rendering.",
    icon: "compass",
    displayOrder: 3,
    enabled: true,
  },
  {
    id: "topic-4",
    name: "Advanced Next.js",
    category: "Architecture",
    description: "Server actions, cache control primitives, and streaming pipelines.",
    icon: "compass",
    displayOrder: 4,
    enabled: true,
  },
  {
    id: "topic-5",
    name: "Motion & Interaction Design",
    category: "Interface",
    description: "Tactile physics, micro-interactions, and 60 FPS compositor smoothness.",
    icon: "compass",
    displayOrder: 5,
    enabled: true,
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
  wrench: Wrench,
  boxes: Boxes,
};

function resolveIcon(identifier?: string, fallback: typeof Layers = Layers) {
  if (!identifier) return fallback;
  const key = identifier.toLowerCase().trim();
  return ICON_MAP[key] || fallback;
}

// Group development stack into coherent architectural domains
function groupDevStack(items: DevStackItem[]) {
  const groupsMap: Record<string, DevStackItem[]> = {};

  for (const item of items) {
    let groupName = item.group?.trim();
    if (!groupName) {
      const lower = item.name.toLowerCase();
      if (["next.js", "react", "typescript", "tailwind css"].some((n) => lower.includes(n))) {
        groupName = "Core Architecture";
      } else if (["mongodb", "cloudflare"].some((n) => lower.includes(n))) {
        groupName = "Data & Infrastructure";
      } else if (["framer motion", "lenis"].some((n) => lower.includes(n))) {
        groupName = "Motion & Interface";
      } else if (["git"].some((n) => lower.includes(n))) {
        groupName = "Version Control";
      } else {
        groupName = "Core Architecture";
      }
    }

    if (!groupsMap[groupName]) {
      groupsMap[groupName] = [];
    }
    groupsMap[groupName].push(item);
  }

  const preferredOrder = [
    "Core Architecture",
    "Data & Infrastructure",
    "Motion & Interface",
    "Version Control",
  ];

  const ordered: { label: string; items: DevStackItem[] }[] = [];
  for (const label of preferredOrder) {
    if (groupsMap[label] && groupsMap[label].length > 0) {
      ordered.push({ label, items: groupsMap[label] });
      delete groupsMap[label];
    }
  }

  for (const [label, itemsList] of Object.entries(groupsMap)) {
    if (itemsList.length > 0) {
      ordered.push({ label, items: itemsList });
    }
  }

  return ordered;
}

export default async function UsesPage() {
  const content = await getSiteContent();
  const uses = content.uses;

  const updateLabel = uses?.updateLabel || "UPDATED REGULARLY · 2026";
  const eyebrow = uses?.eyebrow || "TOOLS & HARDWARE";
  const pageTitle = uses?.title || "What I Use";
  const pageDescription =
    uses?.description ||
    "The tools, software, and workflows I actually reach for when building, designing, debugging, and shipping.";

  // Daily Stack items from CMS (single source of truth)
  const rawDaily =
    uses?.dailyStack && uses.dailyStack.length > 0
      ? uses.dailyStack
      : DEFAULT_DAILY_STACK;
  const dailyStack = rawDaily
    .filter((tool) => tool.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Development Stack items from CMS
  const rawDev =
    uses?.developmentStack && uses.developmentStack.length > 0
      ? uses.developmentStack
      : DEFAULT_DEV_STACK;
  const devStackItems = rawDev
    .filter((tech) => tech.enabled !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const devGroups = groupDevStack(devStackItems);

  // How I Build steps from CMS
  const rawSteps =
    uses?.howIBuild && uses.howIBuild.length > 0
      ? uses.howIBuild
      : DEFAULT_BUILD_STEPS;
  const buildSteps = rawSteps
    .filter((step) => step.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Currently Exploring topics from CMS
  const rawExploring =
    uses?.currentlyExploring && uses.currentlyExploring.length > 0
      ? uses.currentlyExploring
      : DEFAULT_EXPLORING;
  const exploringItems = rawExploring
    .filter((item) => item.enabled !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // My Setup workbench status modules
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
      {/* Top ambient backdrop for smooth navbar pass-through */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-ink-black via-ink-black/85 to-transparent z-40"
      />

      {/* ─── DESKTOP PRESENTATION (>= 1024px) ─── */}
      <div className="hidden lg:block w-full">
        <div className="w-full max-w-6xl mx-auto pt-32 sm:pt-36 md:pt-40 pb-28 px-6 lg:px-8 flex flex-col gap-24">
          
          {/* Section 0: Page Header */}
          <header className="flex flex-col gap-5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 w-fit">
                <Wrench className="w-3.5 h-3.5" />
                <span>{eyebrow}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.08]">
                {updateLabel}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space leading-tight">
              {pageTitle}
            </h1>

            <p className="text-base lg:text-lg text-muted/90 leading-relaxed font-sans max-w-2xl">
              {pageDescription}
            </p>
          </header>

          {/* Section 1: Daily Stack (Engineering Workbench / Tool Inventory) */}
          <section className="flex flex-col gap-6" aria-label="Daily Stack">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
                  01
                </span>
                <h2 className="text-xl font-bold font-space text-foreground uppercase tracking-wide">
                  Daily Stack
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted/60 uppercase tracking-widest">
                TOOL INVENTORY · {dailyStack.length} ITEMS
              </span>
            </div>

            {/* Workbench Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyStack.map((tool, idx) => {
                const Icon = resolveIcon(tool.icon, Terminal);
                const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
                return (
                  <div
                    key={tool.id || tool.name}
                    className="group rounded-xl p-5 bg-ink-black/60 border border-white/[0.07] hover:border-pacific-cyan/35 transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-pacific-cyan">
                          {numStr}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-pacific-cyan/90 group-hover:border-pacific-cyan/40 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted/70 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                        {tool.category}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-base font-bold font-space text-foreground group-hover:text-pacific-cyan transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-muted/80 leading-relaxed font-sans">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Development Stack (Architecture Map) */}
          <section className="flex flex-col gap-8" aria-label="Development Stack">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
                  02
                </span>
                <h2 className="text-xl font-bold font-space text-foreground uppercase tracking-wide">
                  Development Stack
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted/60 uppercase tracking-widest">
                ARCHITECTURE MAP
              </span>
            </div>

            <div className="flex flex-col gap-8">
              {devGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.05]">
                    <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-pacific-cyan/90">
                      {group.label}
                    </h3>
                    <span className="text-[10px] font-mono text-muted/50 ml-auto">
                      {group.items.length} {group.items.length === 1 ? "component" : "components"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {group.items.map((tech) => {
                      const Icon = resolveIcon(tech.icon, Layers);
                      return (
                        <div
                          key={tech.name}
                          className="rounded-xl p-4 bg-ink-black/50 border border-white/[0.06] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="w-3.5 h-3.5 text-pacific-cyan/80 shrink-0" />
                              <span className="text-sm font-bold font-space text-foreground truncate">
                                {tech.name}
                              </span>
                            </div>
                            {tech.category && (
                              <span className="text-[9.5px] font-mono text-muted/60 shrink-0 px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.05]">
                                {tech.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted/75 leading-relaxed font-sans">
                            {tech.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: How I Build (Process Timeline) */}
          <section className="flex flex-col gap-6" aria-label="How I Build">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
                  03
                </span>
                <h2 className="text-xl font-bold font-space text-foreground uppercase tracking-wide">
                  How I Build
                </h2>
              </div>
            </div>

            {/* Connected Horizontal Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {buildSteps.map((step, idx) => (
                <div
                  key={step.id || step.number || step.step || idx}
                  className="rounded-xl p-5 bg-ink-black/60 border border-white/[0.07] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col gap-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-pacific-cyan px-2 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/20">
                      {step.number || step.step || `0${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-muted/40 uppercase">
                      PHASE 0{idx + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-space text-foreground group-hover:text-pacific-cyan transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs text-muted/80 leading-relaxed font-sans">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: My Setup (Workbench Status Modules) */}
          <section className="flex flex-col gap-6" aria-label="My Setup">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
                  04
                </span>
                <h2 className="text-xl font-bold font-space text-foreground uppercase tracking-wide">
                  My Setup
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted/60 uppercase tracking-widest">
                WORKBENCH STATUS
              </span>
            </div>

            {/* Three distinct module presentations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Module 1: Main Machine (Technical Workstation Module) */}
              <div className="rounded-xl p-6 bg-ink-black/60 border border-white/[0.08] flex flex-col justify-between gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-pacific-cyan text-xs font-mono uppercase tracking-wider">
                  <Laptop className="w-4 h-4" />
                  <span>{mySetup.mainMachine.label}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-2xl font-bold font-space text-foreground">
                    {mySetup.mainMachine.value}
                  </span>
                  {mySetup.mainMachine.description && (
                    <p className="text-xs text-muted/75 leading-relaxed font-sans">
                      {mySetup.mainMachine.description}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-muted/50 uppercase">
                  ACTIVE ENVIRONMENT · WORKSTATION
                </div>
              </div>

              {/* Module 2: Fuel (Editorial / Craftsman Quote Module) */}
              <div className="rounded-xl p-6 bg-ink-black/60 border border-white/[0.08] border-l-2 border-l-apricot-cream flex flex-col justify-between gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-apricot-cream text-xs font-mono uppercase tracking-wider">
                  <Flame className="w-4 h-4" />
                  <span>{mySetup.fuel.label}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-lg font-bold font-space text-foreground leading-snug">
                    {mySetup.fuel.value}
                  </span>
                  {mySetup.fuel.description && (
                    <p className="text-xs text-muted/75 leading-relaxed font-sans">
                      {mySetup.fuel.description}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-muted/50 uppercase">
                  DISCIPLINE · PURPOSE
                </div>
              </div>

              {/* Module 3: Current Status (Live Status Telemetry Module) */}
              <div className="rounded-xl p-6 bg-ink-black/60 border border-white/[0.08] flex flex-col justify-between gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-emerald-400 text-xs font-mono uppercase tracking-wider">
                  <Radio className="w-4 h-4" />
                  <span>{mySetup.currentStatus.label}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xl font-bold font-space text-emerald-300">
                      {mySetup.currentStatus.value}
                    </span>
                  </div>
                  {mySetup.currentStatus.description && (
                    <p className="text-xs text-muted/75 leading-relaxed font-sans">
                      {mySetup.currentStatus.description}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-emerald-400/60 uppercase">
                  STATUS · ACTIVE RUNTIME
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Currently Exploring (Research Board) */}
          <section className="flex flex-col gap-6" aria-label="Currently Exploring">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
                  05
                </span>
                <h2 className="text-xl font-bold font-space text-foreground uppercase tracking-wide">
                  Currently Exploring
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted/60 uppercase tracking-widest">
                RESEARCH BOARD · {exploringItems.length} TOPICS
              </span>
            </div>

            {/* Research Entry List with Apricot Accents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exploringItems.map((topic, idx) => {
                const Icon = resolveIcon(topic.icon, Compass);
                const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
                return (
                  <div
                    key={topic.name}
                    className="rounded-xl p-5 bg-ink-black/50 border border-white/[0.07] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-pacific-cyan">
                          {numStr}
                        </span>
                        <Icon className="w-3.5 h-3.5 text-apricot-cream/80" />
                      </div>
                      {topic.category && (
                        <span className="text-[10px] font-mono text-apricot-cream/80 bg-apricot-cream/[0.06] border border-apricot-cream/20 px-2 py-0.5 rounded uppercase">
                          {topic.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-base font-bold font-space text-foreground group-hover:text-pacific-cyan transition-colors">
                        {topic.name}
                      </h3>
                      <p className="text-xs text-muted/75 leading-relaxed font-sans">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

      {/* ─── SMARTPHONE & TABLET PRESENTATION (< 1024px) ─── */}
      <div className="block lg:hidden w-full">
        <MobileUsesView
          eyebrow={eyebrow}
          updateLabel={updateLabel}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          dailyStack={dailyStack}
          devGroups={devGroups}
          buildSteps={buildSteps}
          mySetup={mySetup}
          exploringItems={exploringItems}
        />
      </div>
    </div>
  );
}

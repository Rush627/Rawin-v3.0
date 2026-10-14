import { getSiteContent, splitLedgerDescription, type DailyStackItem, type DevStackItem, type BuildStepItem, type ExploringItem, publicSiteClosed } from "@/lib/site-content";
import MaskText from "@/components/system/MaskText";
import Reveal from "@/components/system/Reveal";
import ActivateOnView from "@/components/uses/ActivateOnView";
import InstrumentDial from "@/components/uses/InstrumentDial";
import UsesHead from "@/components/uses/UsesHead";
import UsesIcon from "@/components/uses/UsesIcon";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("uses", "/uses");
}

export const revalidate = 3600;

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

  if (groupsMap && typeof groupsMap === "object") {
    for (const [label, itemsList] of Object.entries(groupsMap)) {
      if (itemsList && itemsList.length > 0) {
        ordered.push({ label, items: itemsList });
      }
    }
  }

  return ordered;
}


export default async function UsesPage() {
  // maintenance, offline or unreadable content: the layout shows the maintenance screen
  if (await publicSiteClosed()) return null;

  const content = await getSiteContent();
  const uses = content.uses;

  // Ledger: label, description and year are separate CMS fields, composed only here
  const ledgerLabel = uses?.ledgerLabel?.trim() || "Ledger";
  const ledgerParts = splitLedgerDescription(uses?.updateLabel);
  const ledgerDescription = ledgerParts.description || "UPDATED REGULARLY";
  const ledgerYear = uses?.updatedYear?.trim() || ledgerParts.year;
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


  const [titleHead, ...titleRest] = pageTitle.trim().split(/\s+/);
  const titleTail = titleRest.join(" ");
  const pad = (n: number) => String(n).padStart(2, "0");
  const plural = (n: number, one: string, many: string) => `${pad(n)} ${n === 1 ? one : many}`;
  // a horizontal sequence while the stages still fit one row; longer processes run vertically
  const rowProcess = buildSteps.length > 0 && buildSteps.length <= 6;

  return (
    <div className="uses-scope field-ground flex flex-col">
      {/* Hero: title, lede and ledger on the left; the instrument plate beside them */}
      <header className="uses-shell uses-hero">
        <div className="uses-head-rule label-mono">
          <span className="uses-lav">04</span>
          <span aria-hidden="true" className="uses-head-line" />
          <span className="text-fg-muted">{eyebrow}</span>
          <span aria-hidden="true" className="uses-head-count text-fg-subtle">
            RAWIN / v3
          </span>
        </div>
        <div className="uses-hero-grid">
          <div className="uses-hero-main">
            <MaskText
              as="h1"
              immediate
              className="uses-hero-title text-fg"
              lines={
                titleTail
                  ? [<span key="a">{titleHead}</span>, <em key="b" className="italic uses-lav">{titleTail}</em>]
                  : [<span key="a">{pageTitle}</span>]
              }
              phoneInline={{ chars: pageTitle.length }}
            />
            <p className="uses-hero-lede">{pageDescription}</p>
            <dl className="uses-metrics">
              <div>
                <dt className="label-mono">Instruments</dt>
                <dd className="uses-metric-num">{pad(dailyStack.length)}</dd>
              </div>
              <div>
                <dt className="label-mono">Stack</dt>
                <dd className="uses-metric-num">{pad(devStackItems.length)}</dd>
              </div>
              <div className="is-wide">
                <dt className="label-mono">{ledgerLabel}</dt>
                <dd className="uses-metric-text">
                  {ledgerDescription}
                  {ledgerYear && (
                    <>
                      {" · "}
                      <time dateTime={ledgerYear}>{ledgerYear}</time>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <InstrumentDial instruments={dailyStack.length} stack={devStackItems.length} total={dailyStack.length + devStackItems.length} />
        </div>
      </header>

      <div className="uses-shell uses-sections">
        {/* 01: Everyday instruments, an index of tools */}
        <section aria-labelledby="uses-daily">
          <UsesHead
            id="uses-daily"
            index="01"
            eyebrow="Daily stack"
            lead="Everyday"
            em="instruments"
            count={plural(dailyStack.length, "entry", "entries")}
            note="Software in daily use, indexed by the role it plays."
          />
          <ol className="uses-instruments">
            {dailyStack.map((tool, i) => (
              <Reveal as="li" key={tool.id || tool.name} delay={(i % 3) * 0.06} y={18} className="uses-instrument">
                <div className="uses-instrument-top label-mono">
                  <span className="uses-lav">{pad(i + 1)}</span>
                  <span className="text-fg-subtle">{tool.category}</span>
                </div>
                <span className="uses-instrument-glyph">
                  <UsesIcon name={tool.icon} className="h-[18px] w-[18px]" />
                </span>
                <h3 className="uses-instrument-name">{tool.name}</h3>
                <p className="uses-instrument-desc">{tool.description}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* 02: Development stack, a typeset reference grouped by layer */}
        <section aria-labelledby="uses-stack">
          <UsesHead
            id="uses-stack"
            index="02"
            eyebrow="Development stack"
            lead="The"
            em="architecture"
            count={plural(devGroups.length, "layer", "layers")}
            note="Grouped by the layer of the system each technology serves."
          />
          <div className="uses-stack">
            {devGroups.map((group, gi) => {
              const letter = String.fromCharCode(65 + (gi % 26));
              return (
                <Reveal key={group.label} y={18} className="uses-group">
                  <div className="uses-group-head">
                    <span aria-hidden="true" className="uses-group-letter">
                      {letter}
                    </span>
                    <div>
                      <h3 className="uses-group-title">{group.label}</h3>
                      <p className="label-mono text-fg-subtle uses-group-count">{plural(group.items.length, "entry", "entries")}</p>
                    </div>
                  </div>
                  <ul className="uses-group-list">
                    {group.items.map((item, ii) => (
                      <li key={item.id || item.name} className="uses-tech">
                        <span aria-hidden="true" className="uses-tech-code label-mono">
                          {letter}.{pad(ii + 1)}
                        </span>
                        <span className="uses-tech-name">{item.name}</span>
                        <span className="uses-tech-desc">{item.description}</span>
                        {item.category && <span className="uses-tech-cat label-mono">{item.category}</span>}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* 03: The workbench, one console with three readouts */}
        <section aria-labelledby="uses-setup">
          <UsesHead
            id="uses-setup"
            index="03"
            eyebrow="My setup"
            lead="On the"
            em="workbench"
            note="The machine, the motivation, and where things stand."
          />
          <ActivateOnView className="uses-console" data-activate="">
            <div aria-hidden="true" className="uses-console-bar label-mono">
              <span className="uses-lav">03</span>
              <span>Workbench</span>
              <span className="uses-console-ruler" />
            </div>
            <dl className="uses-console-grid">
              <div className="uses-cell is-machine">
                <dt className="label-mono text-fg-subtle">{mySetup.mainMachine.label}</dt>
                <dd>
                  <p className="uses-machine-value">{mySetup.mainMachine.value}</p>
                  {mySetup.mainMachine.description && <p className="uses-cell-desc">{mySetup.mainMachine.description}</p>}
                  <svg aria-hidden="true" viewBox="0 0 600 72" preserveAspectRatio="none" className="uses-trace">
                    <path className="uses-trace-base" d="M0 52 H600" />
                    <path
                      className="uses-trace-line"
                      d="M0 52 H96 C112 52 116 30 128 30 S144 52 160 52 H232 C244 52 250 14 262 14 S280 52 294 52 H372 C384 52 388 38 398 38 S412 52 424 52 H600"
                    />
                    {Array.from({ length: 25 }, (_, i) => (
                      <line key={i} className="uses-trace-tick" x1={i * 25} y1={i % 4 === 0 ? 62 : 66} x2={i * 25} y2="72" />
                    ))}
                    <rect className="uses-trace-scan" x="0" y="0" width="2" height="72" />
                  </svg>
                </dd>
              </div>
              <div className="uses-cell is-fuel">
                <dt className="label-mono text-fg-subtle">{mySetup.fuel.label}</dt>
                <dd>
                  <p className="uses-fuel-value">{mySetup.fuel.value}</p>
                  {mySetup.fuel.description && <p className="uses-cell-desc">{mySetup.fuel.description}</p>}
                </dd>
              </div>
              <div className="uses-cell is-status">
                <dt className="label-mono text-fg-subtle">
                  <span aria-hidden="true" className="uses-pulse" />
                  {mySetup.currentStatus.label}
                </dt>
                <dd>
                  <p className="uses-status-value">{mySetup.currentStatus.value}</p>
                  {mySetup.currentStatus.description && <p className="uses-cell-desc">{mySetup.currentStatus.description}</p>}
                </dd>
              </div>
            </dl>
          </ActivateOnView>
        </section>

        {/* 04: From brief to shipped, a connected sequence */}
        {buildSteps.length > 0 && (
          <section aria-labelledby="uses-process">
            <UsesHead
              id="uses-process"
              index="04"
              eyebrow="How I build"
              lead="From brief"
              em="to shipped"
              count={plural(buildSteps.length, "stage", "stages")}
              note="Each stage hands its work to the next."
            />
            <ActivateOnView
              as="ol"
              data-activate=""
              className={`uses-process${rowProcess ? " is-row" : ""}`}
              style={{ "--n": buildSteps.length } as React.CSSProperties}
            >
              {buildSteps.map((step, i) => (
                <li key={step.id || step.title} data-activate="" className="uses-step" style={{ "--i": i } as React.CSSProperties}>
                  <span aria-hidden="true" className="uses-node">
                    <span />
                  </span>
                  <Reveal y={14} delay={rowProcess ? i * 0.08 : 0} className="uses-step-body">
                    <p className="uses-step-num label-mono">{step.number || step.step || pad(i + 1)}</p>
                    <h3 className="uses-step-title">{step.title}</h3>
                    <p className="uses-step-desc">{step.description}</p>
                  </Reveal>
                </li>
              ))}
            </ActivateOnView>
          </section>
        )}

        {/* 05: On the horizon, a roadmap path that continues past its last entry */}
        {exploringItems.length > 0 && (
          <section aria-labelledby="uses-exploring">
            <UsesHead
              id="uses-exploring"
              index="05"
              eyebrow="Currently exploring"
              lead="On the"
              em="horizon"
              count={plural(exploringItems.length, "subject", "subjects")}
              note="Subjects under active study, not yet part of the everyday stack."
            />
            <ActivateOnView as="ol" className="uses-horizon">
              {exploringItems.map((item, i) => (
                <li key={item.id || item.name} data-activate="" className="uses-topic">
                  <span aria-hidden="true" className="uses-node is-small">
                    <span />
                  </span>
                  <Reveal y={14} className="uses-topic-body">
                    <span className="uses-topic-num label-mono">{pad(i + 1)}</span>
                    <h3 className="uses-topic-name">{item.name}</h3>
                    <p className="uses-topic-desc">{item.description}</p>
                    {item.category && <span className="uses-topic-cat label-mono">{item.category}</span>}
                  </Reveal>
                </li>
              ))}
            </ActivateOnView>
          </section>
        )}
      </div>
    </div>
  );
}

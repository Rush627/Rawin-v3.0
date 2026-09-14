import { getDatabase } from "./mongodb";
import { GridFSBucket, ObjectId } from "mongodb";
import type { Readable } from "stream";

export interface GlobalContent {
  brandName: string;
  siteTitle: string;
  shortBio: string;
  availabilityStatus: string;
  availabilityBadge: string;
  availabilityStatusColor?: "green" | "orange" | "red";
  footerCopyright: string;
  contactEmail: string;
  location: string;
}

export interface HomeContent {
  heroStatus: string;
  heroBadge: string;
  heroTitlePrefix: string;
  heroName: string;
  heroBio: string;
  heroPrimaryCtaText: string;
  heroSecondaryCtaText: string;
  featuredHeading: string;
  featuredDescription: string;
}

export interface EvolutionMilestoneItem {
  id: string;
  year: string;
  label: string;
  eyebrow?: string;
  progression: string;
  quote?: string;
  title: string;
  domain: string;
  description: string;
  technologies: string[];
  url?: string;
  status: "archived" | "current";
  isCurrent: boolean;
  preview: string;
  previewAlt?: string;
  ctaText: string;
  displayOrder: number;
  order?: number;
}

export interface AboutPrincipleItem {
  id: string;
  number: string;
  title: string;
  statement: string;
  icon: string;
  displayOrder: number;
}

export interface AboutFocusItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
}

export interface AboutContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  leadText: string;
  narrativeText: string;
  evolutionEyebrow?: string;
  evolutionHeading?: string;
  evolutionDescription?: string;
  evolution: EvolutionMilestoneItem[];
  principlesEyebrow?: string;
  principlesHeading?: string;
  principlesDescription?: string;
  principles: AboutPrincipleItem[];
  journeyEyebrow?: string;
  journeyHeading: string;
  journeyDescription: string;
  focusEyebrow?: string;
  focusHeading?: string;
  focusDescription?: string;
  focusAreas: AboutFocusItem[];
  ctaEyebrow?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  ctaResumeText?: string;
  ctaContactText?: string;
}

export interface ContactSocials {
  github: string;
  linkedin: string;
  twitter: string;
}

export interface ContactFormPlaceholders {
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
}

export interface ContactContent {
  eyebrow: string;
  title: string;
  description: string;
  email: string;
  phone: string;
  showPhoneNumber: boolean;
  location: string;
  socials: ContactSocials;
  form: ContactFormPlaceholders;
  successTitle: string;
  successMessage: string;
}

export type ResumeStatusIndicator = "green" | "orange" | "cyan" | "gray";

export interface ResumeContact {
  location: string;
  email: string;
  website: string;
}

export interface ResumeStatus {
  text: string;
  indicator: ResumeStatusIndicator;
}

export interface ResumeSkillGroup {
  id: string;
  title: string;
  skills: string[];
  displayOrder: number;
}

export interface ResumeExperienceItem {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location?: string;
  bullets: string[];
  displayOrder: number;
}

export interface ResumeEducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  displayOrder: number;
}

export interface ResumeCta {
  heading: string;
  description: string;
  buttonText: string;
}

export interface ResumePdfMeta {
  fileId: string;
  filename: string;
  url: string;
  size?: number;
  updatedAt?: string;
}

export interface ResumeContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  summary: string;
  ctaText: string;
  contact: ResumeContact;
  status: ResumeStatus;
  skills: ResumeSkillGroup[];
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  cta: ResumeCta;
  pdf?: ResumePdfMeta | null;
}

export interface DevStackItem {
  name: string;
  description: string;
  category?: string;
  icon?: string;
  displayOrder: number;
}

export interface ExploringItem {
  name: string;
  description: string;
  category?: string;
  icon?: string;
  displayOrder: number;
}

export interface SetupItem {
  label: string;
  value: string;
  description: string;
}

export interface MySetupContent {
  mainMachine: SetupItem;
  fuel: SetupItem;
  currentStatus: SetupItem;
}

export interface UsesContent {
  eyebrow: string;
  title: string;
  description: string;
  updatedYear: string;
  developmentStack: DevStackItem[];
  currentlyExploring: ExploringItem[];
  mySetup: MySetupContent;
}

export interface AIContent {
  eyebrow: string;
  title: string;
  description: string;
  greetingMessage: string;
  inputPlaceholder: string;
  suggestedPrompts: string[];
  suggestedPromptsLabel?: string;
}

export interface AssetMeta {
  url: string;
  alt?: string;
  updatedAt?: string;
}

export interface SiteAssets {
  profilePhoto: AssetMeta;
  logo: AssetMeta;
  favicon: AssetMeta;
}

export interface MaintenanceContent {
  enabled: boolean;
  showMessage: boolean;
  message: string;
  endsAt?: string | null;
}

export type AssetKey = "profilePhoto" | "logo" | "favicon";

export interface SiteContent {
  _id?: string;
  key: "main";
  global: GlobalContent;
  home: HomeContent;
  about: AboutContent;
  contact: ContactContent;
  resume: ResumeContent;
  uses: UsesContent;
  ai: AIContent;
  assets: SiteAssets;
  maintenance: MaintenanceContent;
  createdAt?: string;
  updatedAt?: string;
}

export type ContentSectionKey =
  | "global"
  | "home"
  | "about"
  | "contact"
  | "resume"
  | "uses"
  | "ai"
  | "assets"
  | "maintenance";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  key: "main",
  assets: {
    profilePhoto: {
      url: "/images/profile.png",
      alt: "Rushan Siddiqui : Full Stack Developer",
    },
    logo: {
      url: "/images/logo.png",
      alt: "RAWIN Logo",
    },
    favicon: {
      url: "/favicon.png",
      alt: "RAWIN Favicon",
    },
  },
  global: {
    brandName: "RAWIN",
    siteTitle: "Rushan Siddiqui : Full Stack Developer",
    shortBio:
      "Full Stack Developer building clean interfaces, thoughtful user experiences, and modern web applications.",
    availabilityStatus: "Open to opportunities",
    availabilityBadge: "Available for hire",
    availabilityStatusColor: "green",
    footerCopyright: "RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.",
    contactEmail: "rushansiddiqui5262@gmail.com",
    location: "Jaunpur, Uttar Pradesh, India",
  },
  home: {
    heroStatus: "Open to opportunities",
    heroBadge: "Available for hire",
    heroTitlePrefix: "Hi, I'm",
    heroName: "Rushan Siddiqui",
    heroBio:
      "Building fast, thoughtful web applications with Next.js, TypeScript, and modern design systems. Focused on clean code and great user experience.",
    heroPrimaryCtaText: "Explore Case Studies",
    heroSecondaryCtaText: "Let's Connect",
    featuredHeading: "Featured Case Studies",
    featuredDescription: "Selected Work",
  },
  about: {
    eyebrow: "ABOUT",
    title: "About Rushan Siddiqui",
    subtitle: "Full Stack Developer & Digital Craftsman",
    leadText:
      "I build for the web, starting with interfaces and gradually moving deeper into the systems behind them.",
    narrativeText:
      "What began as an early curiosity with layouts and styling has grown into a disciplined focus on the entire web stack: from accessible, fluid interface design and frontend performance to type-safe APIs and modern application architecture.",
    evolutionEyebrow: "A RECORD OF THE BUILD",
    evolutionHeading: "From a first HTML page to a full engineering platform.",
    evolutionDescription: "RAWIN has evolved alongside the way I build for the web.",
    evolution: [
      {
        id: "milestone-2022",
        year: "2022",
        label: "FIRST BUILD",
        progression: "I learned to build.",
        title: "The First Build",
        domain: "Rushansidd.in",
        description:
          "My first personal website, built from the ground up with HTML and CSS. It was where I began experimenting with layouts, typography and creating a personal identity on the web.",
        technologies: ["HTML", "CSS"],
        url: "https://rush627.github.io/Rushansidd.in",
        status: "archived",
        isCurrent: false,
        preview: "/images/evolution-2022.png",
        previewAlt: "The First Build (2022) preview",
        ctaText: "VIEW WEBSITE",
        displayOrder: 1,
      },
      {
        id: "milestone-2023",
        year: "2023",
        label: "RAWIN V2.0",
        progression: "I learned to refine.",
        title: "RAWIN V2.0",
        domain: "Rushan.in",
        description:
          "A significant step forward in both design and implementation. RAWIN V2.0 introduced a more refined visual system, improved responsiveness and richer interaction while remaining a handcrafted static website.",
        technologies: ["HTML", "CSS", "JavaScript"],
        url: "https://rush627.github.io/Rushan.in",
        status: "archived",
        isCurrent: false,
        preview: "/images/evolution-2023.png",
        previewAlt: "RAWIN V2.0 (2023) preview",
        ctaText: "VIEW WEBSITE",
        displayOrder: 2,
      },
      {
        id: "milestone-2026",
        year: "2026",
        label: "RAWIN 3.0",
        progression: "I am building systems.",
        title: "RAWIN 3.0",
        domain: "rawin.dev",
        description:
          "The transition from a static portfolio into a modern engineering platform. RAWIN 3.0 is built with reusable components, modern application architecture, intentional interaction and a stronger focus on building complete digital experiences.",
        technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
        status: "current",
        isCurrent: true,
        preview: "/images/evolution-2026.png",
        previewAlt: "RAWIN 3.0 (2026) preview",
        ctaText: "YOU ARE HERE",
        displayOrder: 3,
      },
    ],
    principlesEyebrow: "HOW I BUILD",
    principlesHeading: "A few principles I keep close.",
    principles: [
      {
        id: "principle-1",
        number: "01",
        title: "ARCHITECTURE",
        statement: "Build systems that stay understandable.",
        icon: "layers",
        displayOrder: 1,
      },
      {
        id: "principle-2",
        number: "02",
        title: "EXPERIENCE",
        statement: "Make interfaces feel intentional.",
        icon: "eye",
        displayOrder: 2,
      },
      {
        id: "principle-3",
        number: "03",
        title: "PERFORMANCE",
        statement: "Keep complexity from reaching the user.",
        icon: "zap",
        displayOrder: 3,
      },
      {
        id: "principle-4",
        number: "04",
        title: "CRAFT",
        statement: "Details matter.",
        icon: "palette",
        displayOrder: 4,
      },
    ],
    journeyEyebrow: "ENGINEERING JOURNEY",
    journeyHeading: "Experience and practice.",
    journeyDescription:
      "The ongoing evolution of my development craft, engineering roles, and technical practice.",
    focusEyebrow: "CURRENT FOCUS",
    focusHeading: "What I'm building toward.",
    focusDescription:
      "Exploring where thoughtful interface design and modern engineering can meet.",
    focusAreas: [
      {
        id: "focus-1",
        title: "WEB APPLICATIONS",
        description:
          "Full-stack apps with Next.js, TypeScript, and MongoDB. Focused on clean state and reliable API routes.",
        icon: "terminal",
        displayOrder: 1,
      },
      {
        id: "focus-2",
        title: "INTERACTIVE INTERFACES",
        description:
          "Responsive layouts, micro-interactions, and fluid transitions that make software enjoyable to use.",
        icon: "compass",
        displayOrder: 2,
      },
      {
        id: "focus-3",
        title: "AI INTEGRATION",
        description:
          "Streaming responses, edge function workflows, and practical assistant tools inside web apps.",
        icon: "cpu",
        displayOrder: 3,
      },
      {
        id: "focus-4",
        title: "MODERN WEB ARCHITECTURE",
        description:
          "Modular component systems, Tailwind styling, and maintainable project structures.",
        icon: "boxes",
        displayOrder: 4,
      },
    ],
    ctaEyebrow: "LET'S BUILD TOGETHER",
    ctaHeading: "Have something worth building?",
    ctaDescription: "Open to full-time roles, freelance projects, and collaborations.",
    ctaResumeText: "View Resume",
    ctaContactText: "Get in Touch",
  },
  contact: {
    eyebrow: "Get in Touch",
    title: "Start a Conversation",
    description:
      "Have an open role, a freelance inquiry, or an ambitious project idea? Send a message and I will reply within 24 hours.",
    email: "rushansiddiqui5262@gmail.com",
    phone: "+91 79051 09292",
    showPhoneNumber: false,
    location: "Jaunpur, Uttar Pradesh, India",
    socials: {
      github: "https://github.com/rush627",
      linkedin: "https://www.linkedin.com/in/rushan-s-8ab3b3338",
      twitter: "https://x.com/sidd_rushan__",
    },
    form: {
      namePlaceholder: "Jane Doe",
      emailPlaceholder: "jane@example.com",
      phonePlaceholder: "+1 555 0192",
      subjectPlaceholder: "Project Inquiry / Job Opportunity",
      messagePlaceholder: "Describe your goals, project timeline, or questions...",
    },
    successTitle: "Message Sent Successfully",
    successMessage:
      "Thank you for reaching out! Your message has been sent. I will review it and get back to you shortly.",
  },
  resume: {
    eyebrow: "Curriculum Vitae",
    title: "Rushan Siddiqui",
    subtitle: "Full Stack Developer · Web Craftsman",
    summary:
      "Full stack developer focused on building fast, reliable web applications with Next.js, TypeScript, and modern backend systems. Passionate about interface craft, performance, and writing clean, maintainable code.",
    ctaText: "Hire Me",
    contact: {
      location: "Aligarh, India",
      email: "rushansiddiqui5262@gmail.com",
      website: "https://rawin.dev",
    },
    status: {
      text: "Available for hire",
      indicator: "green",
    },
    skills: [
      {
        id: "frontend",
        title: "Frontend",
        skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML", "CSS", "Framer Motion"],
        displayOrder: 1,
      },
      {
        id: "backend",
        title: "Backend & APIs",
        skills: ["Node.js", "Express", "REST APIs", "Serverless Functions", "Route Handlers"],
        displayOrder: 2,
      },
      {
        id: "data-infra",
        title: "Data & Infrastructure",
        skills: ["MongoDB", "PostgreSQL", "Cloudflare Workers", "Git", "GitHub", "Vercel"],
        displayOrder: 3,
      },
      {
        id: "design-systems",
        title: "Design & Systems",
        skills: ["Figma", "Design Systems", "Responsive Layouts", "Accessibility"],
        displayOrder: 4,
      },
    ],
    experience: [
      {
        id: "exp-1",
        role: "Full Stack Engineer & Independent Builder",
        organization: "RAWIN / Independent Projects",
        startDate: "2024",
        endDate: "",
        current: true,
        location: "Aligarh, India",
        bullets: [
          "Built RAWIN 3.0 as a full-stack portfolio platform with Next.js, TypeScript, Tailwind CSS, and MongoDB.",
          "Implemented modular design system and headless GridFS CMS for dynamic content and media management.",
          "Integrated serverless route handlers, edge functions, and accessible responsive interfaces.",
        ],
        displayOrder: 1,
      },
      {
        id: "exp-2",
        role: "Frontend Developer & UI Craftsman",
        organization: "Client Collaborations & Freelance",
        startDate: "2022",
        endDate: "2023",
        current: false,
        location: "Remote",
        bullets: [
          "Turned Figma designs into responsive, accessible web pages and interactive components.",
          "Optimized frontend asset weight and structural rendering performance for client websites.",
          "Maintained dependable on-time delivery across web portals and custom client features.",
        ],
        displayOrder: 2,
      },
      {
        id: "exp-3",
        role: "Web Developer & Interface Designer",
        organization: "Early Practice & Foundation",
        startDate: "2020",
        endDate: "2022",
        current: false,
        location: "Aligarh, India",
        bullets: [
          "Created interactive landing pages, component templates, and explored browser rendering pipelines.",
          "Built foundational skills across semantic HTML, modern CSS layouts, and JavaScript DOM scripting.",
        ],
        displayOrder: 3,
      },
    ],
    education: [
      {
        id: "edu-1",
        degree: "Bachelor of Computer Applications (BCA)",
        institution: "Aligarh Muslim University",
        location: "Aligarh, India",
        startDate: "2021",
        endDate: "2024",
        description: "Focus on computer science fundamentals, web technologies, and database architecture.",
        displayOrder: 1,
      },
    ],
    cta: {
      heading: "Have an opportunity or project in mind?",
      description: "I'm available for full-time roles, freelance projects, and collaborations.",
      buttonText: "Get in Touch",
    },
    pdf: null,
  },
  uses: {
    eyebrow: "Tools & Hardware",
    title: "What I Use",
    description:
      "The tools, software, and workflows I actually reach for when building, designing, debugging, and shipping.",
    updatedYear: "2026",
    developmentStack: [
      {
        name: "Next.js",
        description: "Application architecture, routing, server rendering, and APIs.",
        category: "Framework",
        icon: "layers",
        displayOrder: 1,
      },
      {
        name: "React",
        description: "Reusable interfaces and interactive components.",
        category: "UI Library",
        icon: "code",
        displayOrder: 2,
      },
      {
        name: "TypeScript",
        description: "Typed application logic and safer component development.",
        category: "Language",
        icon: "cpu",
        displayOrder: 3,
      },
      {
        name: "Tailwind CSS",
        description: "Responsive styling and reusable design patterns.",
        category: "Styling",
        icon: "palette",
        displayOrder: 4,
      },
      {
        name: "MongoDB",
        description: "Portfolio, project, blog, and CMS data.",
        category: "Database",
        icon: "database",
        displayOrder: 5,
      },
      {
        name: "Framer Motion",
        description: "Interface motion and micro-interactions.",
        category: "Animation",
        icon: "zap",
        displayOrder: 6,
      },
      {
        name: "Lenis",
        description: "Smooth scrolling and scroll-driven experiences.",
        category: "Scroll",
        icon: "activity",
        displayOrder: 7,
      },
      {
        name: "Cloudflare Workers / AI",
        description: "Experiments with edge functions and AI workloads.",
        category: "Edge Compute",
        icon: "compass",
        displayOrder: 8,
      },
      {
        name: "Git / GitHub",
        description: "Version control, project history, and collaboration.",
        category: "Source Control",
        icon: "git",
        displayOrder: 9,
      },
    ],
    currentlyExploring: [
      {
        name: "Edge AI",
        description: "Running smaller models closer to users with zero cold starts.",
        category: "Inference",
        icon: "sparkles",
        displayOrder: 1,
      },
      {
        name: "Cloudflare Workers",
        description: "Global edge functions, distributed storage, and serverless compute.",
        category: "Serverless",
        icon: "compass",
        displayOrder: 2,
      },
      {
        name: "WebGPU",
        description: "Hardware-accelerated graphics pipelines and fluid in-browser rendering.",
        category: "Graphics",
        icon: "cpu",
        displayOrder: 3,
      },
      {
        name: "Advanced Next.js",
        description: "Server actions, cache control primitives, and streaming pipelines.",
        category: "Architecture",
        icon: "layers",
        displayOrder: 4,
      },
      {
        name: "Motion & Interaction Design",
        description: "Tactile physics, micro-interactions, and 60 FPS compositor smoothness.",
        category: "Interface",
        icon: "activity",
        displayOrder: 5,
      },
    ],
    mySetup: {
      mainMachine: {
        label: "Main machine",
        value: "Windows PC",
        description: "Workstation configured for daily development.",
      },
      fuel: {
        label: "Fuel",
        value: "Passion to build something worth showing.",
        description: "Curiosity and focused craftsmanship driving every commit.",
      },
      currentStatus: {
        label: "Current status",
        value: "Probably coding.",
        description: "In editor tabs, components, or edge deployments.",
      },
    },
  },
  ai: {
    eyebrow: "ORBIT",
    title: "RAWIN ORBIT",
    description: "Ask about Rushan, RAWIN, projects, experience, or writing.",
    greetingMessage:
      "I'm Rawin Orbit, the AI assistant built by Rushan Siddiqui for RAWIN.",
    inputPlaceholder: "Ask anything about Rushan's work, experience, or skills...",
    suggestedPromptsLabel: "Suggested Prompts",
    suggestedPrompts: [
      "What is RAWIN?",
      "Who founded RAWIN?",
      "Tell me about Rushan's projects",
      "What technologies does Rushan use?",
      "Tell me about Rawin Horizon",
      "What is Rawin Orbit?",
      "Tell me about Strata Commerce",
    ],
  },
  maintenance: {
    enabled: false,
    showMessage: false,
    message: "We'll be back shortly.",
    endsAt: null,
  },
};

const COLLECTION_NAME = "site_content";

let indexEnsured = false;

/**
 * Ensures unique index on key: "main"
 */
export async function ensureSiteContentIndexes(): Promise<void> {
  if (indexEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION_NAME);
    await col.createIndex({ key: 1 }, { unique: true });
    indexEnsured = true;
  } catch (err) {
    console.warn("[SiteContent] Index check notice:", err);
  }
}

/**
 * Deeply merges stored document with default values to prevent undefined fields.
 */
export function mergeWithDefaults(doc: any): SiteContent {
  if (!doc || typeof doc !== "object") {
    return DEFAULT_SITE_CONTENT;
  }

  const canonicalEmail =
    doc.contact?.email ||
    doc.global?.contactEmail ||
    doc.resume?.contact?.email ||
    DEFAULT_SITE_CONTENT.contact.email;

  const canonicalLocation =
    doc.contact?.location ||
    doc.global?.location ||
    doc.resume?.contact?.location ||
    DEFAULT_SITE_CONTENT.contact.location;

  const canonicalPhone =
    doc.contact?.phone !== undefined
      ? String(doc.contact.phone)
      : (doc.resume?.contact?.phone || DEFAULT_SITE_CONTENT.contact.phone);

  const canonicalShowPhoneNumber =
    typeof doc.contact?.showPhoneNumber === "boolean"
      ? doc.contact.showPhoneNumber
      : (typeof doc.contact?.showPhoneNumber === "string"
          ? doc.contact.showPhoneNumber === "true"
          : DEFAULT_SITE_CONTENT.contact.showPhoneNumber);

  const canonicalSocials: ContactSocials = {
    github:
      doc.contact?.socials?.github !== undefined
        ? doc.contact.socials.github
        : DEFAULT_SITE_CONTENT.contact.socials.github,
    linkedin:
      doc.contact?.socials?.linkedin !== undefined
        ? doc.contact.socials.linkedin
        : DEFAULT_SITE_CONTENT.contact.socials.linkedin,
    twitter:
      doc.contact?.socials?.twitter !== undefined
        ? doc.contact.socials.twitter
        : DEFAULT_SITE_CONTENT.contact.socials.twitter,
  };

  const canonicalForm: ContactFormPlaceholders = {
    namePlaceholder:
      doc.contact?.form?.namePlaceholder ||
      DEFAULT_SITE_CONTENT.contact.form.namePlaceholder,
    emailPlaceholder:
      doc.contact?.form?.emailPlaceholder ||
      DEFAULT_SITE_CONTENT.contact.form.emailPlaceholder,
    phonePlaceholder:
      doc.contact?.form?.phonePlaceholder ||
      DEFAULT_SITE_CONTENT.contact.form.phonePlaceholder,
    subjectPlaceholder:
      doc.contact?.form?.subjectPlaceholder ||
      DEFAULT_SITE_CONTENT.contact.form.subjectPlaceholder,
    messagePlaceholder:
      doc.contact?.form?.messagePlaceholder ||
      DEFAULT_SITE_CONTENT.contact.form.messagePlaceholder,
  };

  return {
    _id: doc._id ? doc._id.toString() : undefined,
    key: "main",
    global: {
      brandName: doc.global?.brandName || DEFAULT_SITE_CONTENT.global.brandName,
      siteTitle: doc.global?.siteTitle || DEFAULT_SITE_CONTENT.global.siteTitle,
      shortBio: doc.global?.shortBio || DEFAULT_SITE_CONTENT.global.shortBio,
      availabilityStatus: doc.global?.availabilityStatus || DEFAULT_SITE_CONTENT.global.availabilityStatus,
      availabilityBadge: doc.global?.availabilityBadge || DEFAULT_SITE_CONTENT.global.availabilityBadge,
      availabilityStatusColor: (doc.global?.availabilityStatusColor as "green" | "orange" | "red") || "green",
      footerCopyright: doc.global?.footerCopyright || DEFAULT_SITE_CONTENT.global.footerCopyright,
      contactEmail: canonicalEmail,
      location: canonicalLocation,
    },
    home: {
      heroStatus: doc.home?.heroStatus || DEFAULT_SITE_CONTENT.home.heroStatus,
      heroBadge: doc.home?.heroBadge || DEFAULT_SITE_CONTENT.home.heroBadge,
      heroTitlePrefix: doc.home?.heroTitlePrefix || DEFAULT_SITE_CONTENT.home.heroTitlePrefix,
      heroName: doc.home?.heroName || DEFAULT_SITE_CONTENT.home.heroName,
      heroBio: doc.home?.heroBio || DEFAULT_SITE_CONTENT.home.heroBio,
      heroPrimaryCtaText: doc.home?.heroPrimaryCtaText || DEFAULT_SITE_CONTENT.home.heroPrimaryCtaText,
      heroSecondaryCtaText: doc.home?.heroSecondaryCtaText || DEFAULT_SITE_CONTENT.home.heroSecondaryCtaText,
      featuredHeading: doc.home?.featuredHeading || DEFAULT_SITE_CONTENT.home.featuredHeading,
      featuredDescription: doc.home?.featuredDescription || DEFAULT_SITE_CONTENT.home.featuredDescription,
    },
    about: {
      eyebrow:
        doc.about?.eyebrow && doc.about.eyebrow !== "Biography & Philosophy"
          ? doc.about.eyebrow
          : DEFAULT_SITE_CONTENT.about.eyebrow,
      title: doc.about?.title || DEFAULT_SITE_CONTENT.about.title,
      subtitle: doc.about?.subtitle || DEFAULT_SITE_CONTENT.about.subtitle,
      leadText: doc.about?.leadText || DEFAULT_SITE_CONTENT.about.leadText,
      narrativeText: doc.about?.narrativeText || DEFAULT_SITE_CONTENT.about.narrativeText,
      evolutionEyebrow: doc.about?.evolutionEyebrow || DEFAULT_SITE_CONTENT.about.evolutionEyebrow,
      evolutionHeading: doc.about?.evolutionHeading || DEFAULT_SITE_CONTENT.about.evolutionHeading,
      evolutionDescription: doc.about?.evolutionDescription || DEFAULT_SITE_CONTENT.about.evolutionDescription,
      evolution: Array.isArray(doc.about?.evolution) && doc.about.evolution.length > 0
        ? doc.about.evolution.map((m: any, idx: number) => ({
            id: String(m.id || `milestone-${idx + 1}`),
            year: String(m.year || "2026"),
            label: String(m.label || "MILESTONE"),
            progression: String(m.progression || ""),
            title: String(m.title || "Milestone Title"),
            domain: String(m.domain || "rawin.dev"),
            description: String(m.description || ""),
            technologies: Array.isArray(m.technologies) ? m.technologies.map((t: any) => String(t).trim()).filter(Boolean) : [],
            url: typeof m.url === "string" && m.url.trim() ? m.url.trim() : undefined,
            status: m.isCurrent || m.status === "current" ? ("current" as const) : ("archived" as const),
            isCurrent: Boolean(m.isCurrent || m.status === "current"),
            preview: String(m.preview || `/images/evolution-${m.year || "2026"}.png`),
            previewAlt: typeof m.previewAlt === "string" ? m.previewAlt : `${m.title || ""} (${m.year || ""}) preview`,
            ctaText: String(m.ctaText || (m.isCurrent ? "YOU ARE HERE" : "VIEW WEBSITE")),
            displayOrder: typeof m.displayOrder === "number" ? m.displayOrder : idx + 1,
          }))
        : DEFAULT_SITE_CONTENT.about.evolution,
      principlesEyebrow: doc.about?.principlesEyebrow || DEFAULT_SITE_CONTENT.about.principlesEyebrow,
      principlesHeading: doc.about?.principlesHeading || DEFAULT_SITE_CONTENT.about.principlesHeading,
      principles: Array.isArray(doc.about?.principles) && doc.about.principles.length > 0
        ? doc.about.principles.map((p: any, idx: number) => ({
            id: String(p.id || `principle-${idx + 1}`),
            number: String(p.number || `0${idx + 1}`),
            title: String(p.title || ""),
            statement: String(p.statement || ""),
            icon: String(p.icon || "layers"),
            displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : idx + 1,
          }))
        : DEFAULT_SITE_CONTENT.about.principles,
      journeyEyebrow: doc.about?.journeyEyebrow || DEFAULT_SITE_CONTENT.about.journeyEyebrow,
      journeyHeading: doc.about?.journeyHeading || DEFAULT_SITE_CONTENT.about.journeyHeading,
      journeyDescription: doc.about?.journeyDescription || DEFAULT_SITE_CONTENT.about.journeyDescription,
      focusEyebrow: doc.about?.focusEyebrow || DEFAULT_SITE_CONTENT.about.focusEyebrow,
      focusHeading: doc.about?.focusHeading || DEFAULT_SITE_CONTENT.about.focusHeading,
      focusDescription: doc.about?.focusDescription || DEFAULT_SITE_CONTENT.about.focusDescription,
      focusAreas: Array.isArray(doc.about?.focusAreas) && doc.about.focusAreas.length > 0
        ? doc.about.focusAreas.map((f: any, idx: number) => ({
            id: String(f.id || `focus-${idx + 1}`),
            title: String(f.title || ""),
            description: String(f.description || ""),
            icon: String(f.icon || "terminal"),
            displayOrder: typeof f.displayOrder === "number" ? f.displayOrder : idx + 1,
          }))
        : DEFAULT_SITE_CONTENT.about.focusAreas,
      ctaEyebrow: doc.about?.ctaEyebrow || DEFAULT_SITE_CONTENT.about.ctaEyebrow,
      ctaHeading: doc.about?.ctaHeading || DEFAULT_SITE_CONTENT.about.ctaHeading,
      ctaDescription: doc.about?.ctaDescription || DEFAULT_SITE_CONTENT.about.ctaDescription,
      ctaResumeText: doc.about?.ctaResumeText || DEFAULT_SITE_CONTENT.about.ctaResumeText,
      ctaContactText: doc.about?.ctaContactText || DEFAULT_SITE_CONTENT.about.ctaContactText,
    },
    contact: {
      eyebrow: doc.contact?.eyebrow || DEFAULT_SITE_CONTENT.contact.eyebrow,
      title: doc.contact?.title || DEFAULT_SITE_CONTENT.contact.title,
      description: doc.contact?.description || DEFAULT_SITE_CONTENT.contact.description,
      email: canonicalEmail,
      phone: canonicalPhone,
      showPhoneNumber: canonicalShowPhoneNumber,
      location: canonicalLocation,
      socials: canonicalSocials,
      form: canonicalForm,
      successTitle: doc.contact?.successTitle || DEFAULT_SITE_CONTENT.contact.successTitle,
      successMessage: doc.contact?.successMessage || DEFAULT_SITE_CONTENT.contact.successMessage,
    },
    resume: {
      eyebrow: doc.resume?.eyebrow || DEFAULT_SITE_CONTENT.resume.eyebrow,
      title: doc.resume?.title || DEFAULT_SITE_CONTENT.resume.title,
      subtitle: doc.resume?.subtitle || DEFAULT_SITE_CONTENT.resume.subtitle,
      summary: doc.resume?.summary || DEFAULT_SITE_CONTENT.resume.summary,
      ctaText: doc.resume?.ctaText || DEFAULT_SITE_CONTENT.resume.ctaText,
      contact: {
        location: canonicalLocation,
        email: canonicalEmail,
        website:
          doc.resume?.contact?.website || DEFAULT_SITE_CONTENT.resume.contact.website,
      },
      status: {
        text: doc.resume?.status?.text || DEFAULT_SITE_CONTENT.resume.status.text,
        indicator:
          doc.resume?.status?.indicator &&
          ["green", "orange", "cyan", "gray"].includes(doc.resume.status.indicator)
            ? doc.resume.status.indicator
            : DEFAULT_SITE_CONTENT.resume.status.indicator,
      },
      skills:
        Array.isArray(doc.resume?.skills) && doc.resume.skills.length > 0
          ? doc.resume.skills
          : DEFAULT_SITE_CONTENT.resume.skills,
      experience:
        Array.isArray(doc.resume?.experience) && doc.resume.experience.length > 0
          ? doc.resume.experience
          : DEFAULT_SITE_CONTENT.resume.experience,
      education:
        Array.isArray(doc.resume?.education) && doc.resume.education.length > 0
          ? doc.resume.education
          : DEFAULT_SITE_CONTENT.resume.education,
      cta: {
        heading: doc.resume?.cta?.heading || DEFAULT_SITE_CONTENT.resume.cta.heading,
        description:
          doc.resume?.cta?.description || DEFAULT_SITE_CONTENT.resume.cta.description,
        buttonText:
          doc.resume?.cta?.buttonText || DEFAULT_SITE_CONTENT.resume.cta.buttonText,
      },
      pdf: doc.resume?.pdf?.fileId
        ? {
            fileId: doc.resume.pdf.fileId,
            filename: doc.resume.pdf.filename || "Rushan-Siddiqui-Resume.pdf",
            url: doc.resume.pdf.url || "/api/resume/download",
            size: doc.resume.pdf.size,
            updatedAt: doc.resume.pdf.updatedAt,
          }
        : null,
    },
    uses: {
      eyebrow: doc.uses?.eyebrow || DEFAULT_SITE_CONTENT.uses.eyebrow,
      title: doc.uses?.title || DEFAULT_SITE_CONTENT.uses.title,
      description: doc.uses?.description || DEFAULT_SITE_CONTENT.uses.description,
      updatedYear: doc.uses?.updatedYear || DEFAULT_SITE_CONTENT.uses.updatedYear,
      developmentStack:
        Array.isArray(doc.uses?.developmentStack) && doc.uses.developmentStack.length > 0
          ? doc.uses.developmentStack
          : DEFAULT_SITE_CONTENT.uses.developmentStack,
      currentlyExploring:
        Array.isArray(doc.uses?.currentlyExploring) && doc.uses.currentlyExploring.length > 0
          ? doc.uses.currentlyExploring
          : DEFAULT_SITE_CONTENT.uses.currentlyExploring,
      mySetup: {
        mainMachine: {
          label:
            doc.uses?.mySetup?.mainMachine?.label || DEFAULT_SITE_CONTENT.uses.mySetup.mainMachine.label,
          value:
            doc.uses?.mySetup?.mainMachine?.value || DEFAULT_SITE_CONTENT.uses.mySetup.mainMachine.value,
          description:
            doc.uses?.mySetup?.mainMachine?.description ||
            DEFAULT_SITE_CONTENT.uses.mySetup.mainMachine.description,
        },
        fuel: {
          label: doc.uses?.mySetup?.fuel?.label || DEFAULT_SITE_CONTENT.uses.mySetup.fuel.label,
          value: doc.uses?.mySetup?.fuel?.value || DEFAULT_SITE_CONTENT.uses.mySetup.fuel.value,
          description:
            doc.uses?.mySetup?.fuel?.description || DEFAULT_SITE_CONTENT.uses.mySetup.fuel.description,
        },
        currentStatus: {
          label:
            doc.uses?.mySetup?.currentStatus?.label ||
            DEFAULT_SITE_CONTENT.uses.mySetup.currentStatus.label,
          value:
            doc.uses?.mySetup?.currentStatus?.value ||
            DEFAULT_SITE_CONTENT.uses.mySetup.currentStatus.value,
          description:
            doc.uses?.mySetup?.currentStatus?.description ||
            DEFAULT_SITE_CONTENT.uses.mySetup.currentStatus.description,
        },
      },
    },
    ai: {
      eyebrow:
        doc.ai?.eyebrow && !["AI ASSISTANT", "RAWIN AI ASSISTANT", "AURA", "COGNITIVE ASSISTANT"].includes(doc.ai.eyebrow.toUpperCase())
          ? doc.ai.eyebrow
          : DEFAULT_SITE_CONTENT.ai.eyebrow,
      title:
        doc.ai?.title && !["AI Assistant", "RAWIN AI Assistant", "Aura", "Cognitive Assistant"].includes(doc.ai.title)
          ? doc.ai.title
          : DEFAULT_SITE_CONTENT.ai.title,
      description: doc.ai?.description || DEFAULT_SITE_CONTENT.ai.description,
      greetingMessage:
        doc.ai?.greetingMessage && !doc.ai.greetingMessage.includes("RAWIN AI.")
          ? doc.ai.greetingMessage
          : DEFAULT_SITE_CONTENT.ai.greetingMessage,
      inputPlaceholder: doc.ai?.inputPlaceholder || DEFAULT_SITE_CONTENT.ai.inputPlaceholder,
      suggestedPromptsLabel: doc.ai?.suggestedPromptsLabel || DEFAULT_SITE_CONTENT.ai.suggestedPromptsLabel,
      suggestedPrompts: Array.isArray(doc.ai?.suggestedPrompts) && doc.ai.suggestedPrompts.length > 0
        ? doc.ai.suggestedPrompts.map((p: any) => String(p).trim()).filter(Boolean)
        : DEFAULT_SITE_CONTENT.ai.suggestedPrompts,
    },
    assets: {
      profilePhoto: {
        url: doc.assets?.profilePhoto?.url || DEFAULT_SITE_CONTENT.assets.profilePhoto.url,
        alt: doc.assets?.profilePhoto?.alt || DEFAULT_SITE_CONTENT.assets.profilePhoto.alt,
        updatedAt: doc.assets?.profilePhoto?.updatedAt || DEFAULT_SITE_CONTENT.assets.profilePhoto.updatedAt,
      },
      logo: {
        url: doc.assets?.logo?.url || DEFAULT_SITE_CONTENT.assets.logo.url,
        alt: doc.assets?.logo?.alt || DEFAULT_SITE_CONTENT.assets.logo.alt,
        updatedAt: doc.assets?.logo?.updatedAt || DEFAULT_SITE_CONTENT.assets.logo.updatedAt,
      },
      favicon: {
        url: doc.assets?.favicon?.url || DEFAULT_SITE_CONTENT.assets.favicon.url,
        alt: doc.assets?.favicon?.alt || DEFAULT_SITE_CONTENT.assets.favicon.alt,
        updatedAt: doc.assets?.favicon?.updatedAt || DEFAULT_SITE_CONTENT.assets.favicon.updatedAt,
      },
    },
    maintenance: {
      enabled: (() => {
        if (doc.maintenance?.endsAt) {
          const t = new Date(doc.maintenance.endsAt).getTime();
          if (!isNaN(t) && t <= Date.now()) return false;
        }
        return typeof doc.maintenance?.enabled === "boolean"
          ? doc.maintenance.enabled
          : DEFAULT_SITE_CONTENT.maintenance.enabled;
      })(),
      showMessage:
        typeof doc.maintenance?.showMessage === "boolean"
          ? doc.maintenance.showMessage
          : DEFAULT_SITE_CONTENT.maintenance.showMessage,
      message:
        typeof doc.maintenance?.message === "string"
          ? doc.maintenance.message
          : DEFAULT_SITE_CONTENT.maintenance.message,
      endsAt: (() => {
        if (doc.maintenance?.endsAt) {
          const t = new Date(doc.maintenance.endsAt).getTime();
          if (!isNaN(t) && t <= Date.now()) return null;
        }
        return doc.maintenance?.endsAt instanceof Date
          ? doc.maintenance.endsAt.toISOString()
          : typeof doc.maintenance?.endsAt === "string"
          ? doc.maintenance.endsAt
          : null;
      })(),
    },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

/**
 * Retrieves site content from MongoDB with automatic default seeding and graceful fallback.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    await ensureSiteContentIndexes();
    const db = await getDatabase();
    if (!db) {
      return DEFAULT_SITE_CONTENT;
    }

    const col = db.collection(COLLECTION_NAME);
    let doc = await col.findOne({ key: "main" });

    if (!doc) {
      // Seed default document automatically
      const now = new Date();
      const { _id: _omittedId, ...safeSeedData } = DEFAULT_SITE_CONTENT;
      await col.insertOne({
        ...safeSeedData,
        createdAt: now,
        updatedAt: now,
      });
      return DEFAULT_SITE_CONTENT;
    }

    // Automatic Maintenance Expiry Check & Database Normalization:
    // If maintenance was enabled with a duration timer that has now expired,
    // persist the reset to MongoDB immediately so the next read and UI see STANDBY/LIVE.
    if (doc.maintenance?.enabled && doc.maintenance?.endsAt) {
      const endsTime = new Date(doc.maintenance.endsAt).getTime();
      if (!isNaN(endsTime) && endsTime <= Date.now()) {
        try {
          await col.updateOne(
            { key: "main" },
            {
              $set: {
                "maintenance.enabled": false,
                "maintenance.endsAt": null,
                updatedAt: new Date(),
              },
            }
          );
          doc.maintenance.enabled = false;
          doc.maintenance.endsAt = null;
        } catch (updateErr) {
          console.error("[SiteContent] Failed to persist expired maintenance reset:", updateErr);
        }
      }
    }

    return mergeWithDefaults(doc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SiteContent] Error fetching content (using fallback defaults):", msg);
    return DEFAULT_SITE_CONTENT;
  }
}

/**
 * Updates a specific section of the site content in MongoDB.
 */
export async function updateSiteSection<K extends ContentSectionKey>(
  section: K,
  data: Partial<SiteContent[K]>
): Promise<boolean> {
  try {
    await ensureSiteContentIndexes();
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable.");
    }

    const col = db.collection(COLLECTION_NAME);
    const now = new Date();

    // Prepare dot-notated update fields to only mutate the target section
    const updateFields: Record<string, any> = {
      updatedAt: now,
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        updateFields[`${section}.${key}`] = value.trim();
      } else if (value !== undefined) {
        updateFields[`${section}.${key}`] = value;
      }
    }

    const result = await col.updateOne(
      { key: "main" },
      {
        $set: updateFields,
        $setOnInsert: {
          key: "main",
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return result.acknowledged;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SiteContent] Error updating section (${section}):`, msg);
    throw new Error(msg);
  }
}

const ASSET_BUCKET_NAME = "site_assets";

/**
 * Stores an uploaded asset file buffer into MongoDB GridFS and updates the asset metadata.
 */
export async function storeAssetFile(
  assetType: AssetKey,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  alt?: string
): Promise<{ fileId: string; url: string }> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });

  // Delete prior GridFS files for this assetType to prevent orphaned files
  try {
    const existingFiles = await bucket
      .find({ "metadata.assetType": assetType })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Clean prior asset notice:", cleanErr);
  }

  // Upload new file stream into GridFS
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      contentType: mimeType,
      assetType,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });

  const fileId = uploadStream.id.toString();
  const url = `/api/assets/${assetType}?v=${Date.now()}`;
  const now = new Date();

  // Update site_content document with the asset URL reference
  const col = db.collection(COLLECTION_NAME);
  const updatePayload: Record<string, any> = {
    [`assets.${assetType}.url`]: url,
    [`assets.${assetType}.updatedAt`]: now.toISOString(),
    updatedAt: now,
  };
  if (alt !== undefined && alt.trim() !== "") {
    updatePayload[`assets.${assetType}.alt`] = alt.trim();
  }

  await col.updateOne({ key: "main" }, { $set: updatePayload }, { upsert: true });

  return { fileId, url };
}

/**
 * Retrieves an asset file stream and metadata from MongoDB GridFS.
 */
export async function getAssetFile(
  assetType: AssetKey | string
): Promise<{ stream: Readable; contentType: string; filename: string } | null> {
  const db = await getDatabase();
  if (!db) return null;

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
  const files = await bucket
    .find({ "metadata.assetType": assetType })
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray();

  if (!files || files.length === 0) {
    return null;
  }

  const file = files[0];
  const stream = bucket.openDownloadStream(file._id);
  const contentType =
    (file.metadata as any)?.contentType ||
    (file as any).contentType ||
    "application/octet-stream";

  return {
    stream: stream as unknown as Readable,
    contentType,
    filename: file.filename,
  };
}

/**
 * Updates asset metadata (e.g. direct URL or alt text) without uploading a file.
 */
export async function updateSiteAssetMeta(
  assetType: AssetKey,
  meta: Partial<AssetMeta>
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");

  const col = db.collection(COLLECTION_NAME);
  const now = new Date();
  const updateFields: Record<string, any> = {
    updatedAt: now,
  };

  if (meta.url !== undefined) {
    updateFields[`assets.${assetType}.url`] = meta.url.trim();
  }
  if (meta.alt !== undefined) {
    updateFields[`assets.${assetType}.alt`] = meta.alt.trim();
  }
  updateFields[`assets.${assetType}.updatedAt`] = now.toISOString();

  const res = await col.updateOne(
    { key: "main" },
    { $set: updateFields },
    { upsert: true }
  );
  return res.acknowledged;
}

/**
 * Resets an asset to its default known-good state.
 */
export async function resetAssetToDefault(assetType: AssetKey): Promise<boolean> {
  const db = await getDatabase();
  if (db) {
    try {
      const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
      const existingFiles = await bucket
        .find({ "metadata.assetType": assetType })
        .toArray();
      for (const file of existingFiles) {
        await bucket.delete(file._id).catch(() => {});
      }
    } catch (cleanErr) {
      console.warn("[SiteContent] Reset asset notice:", cleanErr);
    }
  }

  const defaultAsset = DEFAULT_SITE_CONTENT.assets[assetType];
  const now = new Date();

  if (!db) return false;
  const col = db.collection(COLLECTION_NAME);
  await col.updateOne(
    { key: "main" },
    {
      $set: {
        [`assets.${assetType}`]: {
          url: defaultAsset.url,
          alt: defaultAsset.alt || "",
          updatedAt: now.toISOString(),
        },
        updatedAt: now,
      },
    }
  );
  return true;
}

/**
 * Stores an uploaded milestone image file buffer into MongoDB GridFS.
 */
export async function storeMilestoneImage(
  milestoneId: string,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  const assetType = `evolution-${milestoneId}`;
  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });

  // Delete prior GridFS file for this milestone
  try {
    const existingFiles = await bucket
      .find({ "metadata.assetType": assetType })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Clean prior milestone image notice:", cleanErr);
  }

  const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const uploadStream = bucket.openUploadStream(sanitizedName, {
    metadata: {
      contentType: mimeType,
      assetType,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });

  return `/api/assets/${assetType}?v=${Date.now()}`;
}

const RESUME_PDF_ASSET_TYPE = "resumePdf";

/**
 * Stores an uploaded resume PDF file buffer into MongoDB GridFS and updates the resume.pdf metadata.
 */
export async function storeResumePdfFile(
  fileBuffer: Buffer,
  filename: string,
  size: number
): Promise<{ fileId: string; filename: string; url: string; size: number }> {
  // 1. Validate size <= 10MB
  if (size > 10 * 1024 * 1024) {
    throw new Error("Resume PDF exceeds maximum allowed size of 10MB.");
  }

  // 2. Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    fileBuffer.length < 5 ||
    fileBuffer[0] !== 0x25 ||
    fileBuffer[1] !== 0x50 ||
    fileBuffer[2] !== 0x44 ||
    fileBuffer[3] !== 0x46 ||
    fileBuffer[4] !== 0x2d
  ) {
    throw new Error("Invalid file format. File must be a valid PDF document.");
  }

  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });

  // Upload new file stream into GridFS FIRST
  const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const uploadStream = bucket.openUploadStream(sanitizedName, {
    metadata: {
      contentType: "application/pdf",
      assetType: RESUME_PDF_ASSET_TYPE,
      purpose: "downloadable-resume",
      uploadedAt: new Date(),
      size,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });

  const fileId = uploadStream.id.toString();
  const url = `/api/resume/download?v=${Date.now()}`;
  const now = new Date();

  // Delete prior GridFS files for resumePdf
  try {
    const existingFiles = await bucket
      .find({
        "metadata.assetType": RESUME_PDF_ASSET_TYPE,
        _id: { $ne: uploadStream.id },
      })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Clean prior resume PDF notice:", cleanErr);
  }

  // Update site_content document
  const col = db.collection(COLLECTION_NAME);
  await col.updateOne(
    { key: "main" },
    {
      $set: {
        "resume.pdf": {
          fileId,
          filename: sanitizedName,
          url,
          size,
          updatedAt: now.toISOString(),
        },
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  return { fileId, filename: sanitizedName, url, size };
}

/**
 * Retrieves the active resume PDF file stream and metadata from MongoDB GridFS.
 */
export async function getResumePdfFile(): Promise<{
  stream: Readable;
  contentType: string;
  filename: string;
  size: number;
} | null> {
  const db = await getDatabase();
  if (!db) return null;

  const col = db.collection(COLLECTION_NAME);
  const doc = await col.findOne({ key: "main" });
  if (!doc?.resume?.pdf?.fileId) {
    return null;
  }

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(doc.resume.pdf.fileId);
  } catch {
    return null;
  }

  const files = await bucket.find({ _id: objectId }).limit(1).toArray();
  if (!files || files.length === 0) {
    return null;
  }

  const file = files[0];
  const stream = bucket.openDownloadStream(file._id);

  return {
    stream: stream as unknown as Readable,
    contentType: "application/pdf",
    filename: doc.resume.pdf.filename || "Rushan-Siddiqui-Resume.pdf",
    size: file.length,
  };
}

/**
 * Deletes the resume PDF from GridFS and clears resume.pdf in site_content.
 */
export async function removeResumePdfFile(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
  try {
    const existingFiles = await bucket
      .find({ "metadata.assetType": RESUME_PDF_ASSET_TYPE })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Remove resume PDF notice:", cleanErr);
  }

  const col = db.collection(COLLECTION_NAME);
  const now = new Date();
  await col.updateOne(
    { key: "main" },
    {
      $set: {
        "resume.pdf": null,
        updatedAt: now,
      },
    }
  );

  return true;
}

export interface PublicAvailability {
  status: "live" | "offline" | "maintenance";
  message?: string;
  endsAt?: string | null;
}

/**
 * Lightweight query for public website availability status with zero sensitive data.
 * Automatically normalizes expired maintenance timers in MongoDB.
 */
export async function getPublicAvailability(): Promise<PublicAvailability> {
  try {
    const db = await getDatabase();
    if (!db) {
      return { status: "live" };
    }

    const col = db.collection(COLLECTION_NAME);
    const doc = await col.findOne({ key: "main" }, { projection: { maintenance: 1 } });
    if (!doc?.maintenance?.enabled) {
      return { status: "live" };
    }

    const maintenance = doc.maintenance;
    const endsAt = maintenance.endsAt;

    // Check if maintenance mode with timer has expired
    if (endsAt) {
      const endsTime = new Date(endsAt).getTime();
      if (!isNaN(endsTime) && endsTime <= Date.now()) {
        try {
          await col.updateOne(
            { key: "main" },
            {
              $set: {
                "maintenance.enabled": false,
                "maintenance.endsAt": null,
                updatedAt: new Date(),
              },
            }
          );
        } catch (updateErr) {
          console.error("[SiteContent] Failed to persist expired maintenance reset:", updateErr);
        }
        return { status: "live" };
      }
    }

    if (maintenance.showMessage) {
      const msg = typeof maintenance.message === "string" && maintenance.message.trim()
        ? maintenance.message.trim()
        : "We'll be back shortly.";
      return {
        status: "maintenance",
        message: msg,
        endsAt: endsAt ? (endsAt instanceof Date ? endsAt.toISOString() : String(endsAt)) : null,
      };
    }

    return {
      status: "offline",
    };
  } catch (err) {
    console.error("[getPublicAvailability] error:", err);
    return { status: "live" };
  }
}



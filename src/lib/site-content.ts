import { cache } from "react";
import { unstable_cache } from "next/cache";
import { invalidateCacheTag } from "./cache";
import { getDatabase } from "./mongodb";
import { GridFSBucket, ObjectId } from "mongodb";
import type { Readable } from "stream";
import { DEFAULT_BLOG_CATEGORIES, DEFAULT_PROJECT_CATEGORIES } from "./taxonomy";
import { DEFAULT_WELCOME_MESSAGES, welcomeMessagesFrom } from "./orbit-welcome";
import { BUNDLED, BUNDLED_EVOLUTION, evolutionFallback, resolveAssetUrl } from "./brand-assets";
import {
  DEFAULT_AVAILABILITY,
  DEFAULT_CAPABILITIES,
  DEFAULT_CLOSING,
  DEFAULT_JOURNEY,
  DEFAULT_VALUES,
  normalizeAvailability,
  normalizeCapabilities,
  normalizeJourney,
  normalizeSeo,
  normalizeValues,
  splitLedgerDescription,
  type AvailabilityContent,
  type CapabilityGroup,
  type JourneyItem,
  type SeoContent,
  type ValueItem,
} from "./cms/fields";

export type { AvailabilityContent, CapabilityGroup, JourneyItem, SeoContent, ValueItem };

export interface GlobalContent {
  brandName: string;
  siteTitle: string;
  shortBio: string;
  footerAvailabilityBadge?: string;
  footerAvailabilityColor?: "green" | "orange" | "red";
  footerCopyright: string;
  footerBulletNotification?: string;
  /** Optional small label above the closing contact scene ("One last thing") */
  footerClosingLabel?: string;
  /** Closing scene copy: the invitation (one *word* in asterisks is emphasised), the label
   *  above the email address, and the call-to-action button. */
  closingInvite?: string;
  closingPrompt?: string;
  closingCta?: string;
  contactEmail: string;
  location: string;
  /** Header brand presentation: typographic wordmark (default) or the uploaded logo asset */
  headerBrand?: "wordmark" | "logo";
  /**
   * First-visit theme per device class, applied only while a visitor has made no choice of
   * their own (an explicit toggle always wins). Smartphone = viewport below 768px (the md
   * breakpoint); tablets and wider use the desktop default.
   */
  themeDefaultDesktop?: "light" | "dark";
  themeDefaultMobile?: "light" | "dark";
  /**
   * Site sound, as the administrator allows it (both default to on). The visitor's own mute
   * is separate and only ever silences what is allowed here; with both off, the public sound
   * control is not shown at all.
   */
  backgroundSoundEnabled?: boolean;
  clickSoundEnabled?: boolean;
  // Legacy fields retained for backward compatibility:
  availabilityStatus?: string;
  availabilityBadge?: string;
  availabilityStatusColor?: "green" | "orange" | "red";
}

export interface HomeContent {
  heroStatus: string;
  heroBadge: string;
  heroStatusColor?: "green" | "orange" | "red";
  heroTitlePrefix: string;
  heroName: string;
  heroBio: string;
  heroPrimaryCtaText: string;
  heroSecondaryCtaText: string;
  featuredHeading: string;
  featuredDescription?: string;
  heroTypingPhrases?: string[];
  /** Optional homepage section visibility (all default to visible) */
  showCapabilities?: boolean;
  showValues?: boolean;
  showJourney?: boolean;
  /** Optional hero glass panels (all default to visible) */
  showHeroFocus?: boolean;
  showHeroAvailability?: boolean;
  showHeroWork?: boolean;
  /** "The working toolkit" (section 02) */
  capabilities: CapabilityGroup[];
  /** "Why work with me" (section 03) */
  values: ValueItem[];
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

export interface AboutMilestoneLabels {
  milestone01?: string;
  milestone02?: string;
  milestone03?: string;
  currentEra?: string;
}

export interface AboutContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  narrativeEyebrow?: string;
  leadText: string;
  narrativeText: string;
  progressionItem1?: string;
  progressionItem2?: string;
  progressionItem3?: string;
  metadataItem1?: string;
  metadataItem2?: string;
  metadataItem3?: string;
  metadataItem4?: string;
  evolutionEyebrow?: string;
  evolutionHeading?: string;
  evolutionDescription?: string;
  evolution: EvolutionMilestoneItem[];
  milestoneLabels?: AboutMilestoneLabels;
  principlesEyebrow?: string;
  principlesHeading?: string;
  principlesDescription?: string;
  principles: AboutPrincipleItem[];
  journeyEyebrow?: string;
  journeyHeading: string;
  journeyDescription: string;
  /** The engineering journey, shared by the About page and the homepage (section 04). */
  journey: JourneyItem[];
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
  instagram?: string;
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
  /** Expected reply time shown beside the location (when the phone number is not shown). */
  responseTime: string;
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
  /** Download button label (hero and closing actions). */
  pdfLabel: string;
  /** Section names (the numbered headings and the hero index). */
  profileLabel: string;
  skillsLabel: string;
  experienceLabel: string;
  educationLabel: string;
  /** Label over the closing call to action (the open end of the timeline). */
  ctaEyebrow: string;
  /** Heading of the hero contents column (wide desktops). */
  indexLabel: string;
  /** Labels of the hero profile plate (values come from the resume itself). */
  statusLabel: string;
  roleLabel: string;
  locationLabel: string;
  sinceLabel: string;
  contact: ResumeContact;
  status: ResumeStatus;
  skills: ResumeSkillGroup[];
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  cta: ResumeCta;
  pdf?: ResumePdfMeta | null;
}

export interface DailyStackItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export interface BuildStepItem {
  id?: string;
  step?: string;
  number?: string;
  title: string;
  description: string;
  order?: number;
  enabled?: boolean;
}

export interface DevStackItem {
  id?: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  group?: string;
  displayOrder: number;
  enabled?: boolean;
}

export interface ExploringItem {
  id?: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  displayOrder: number;
  enabled?: boolean;
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
  /** Ledger readout in the hero: label, description and year are stored separately and
   *  composed as "<description> · <year>" on the page, so the year is never baked in. */
  ledgerLabel?: string;
  updatedYear: string;
  /** Ledger description (e.g. "UPDATED REGULARLY"); legacy values may still end in "· 2026" */
  updateLabel?: string;
  dailyStack: DailyStackItem[];
  developmentStack: DevStackItem[];
  howIBuild: BuildStepItem[];
  currentlyExploring: ExploringItem[];
  mySetup: MySetupContent;
}

export interface AIContent {
  eyebrow: string;
  title: string;
  description: string;
  greetingMessage: string;
  inputPlaceholder: string;
  mobileComposerPlaceholder?: string;
  desktopComposerPlaceholder?: string;
  /**
   * Short greeting by the visitor's local time (the page picks one: morning 05–12,
   * afternoon 12–17, evening 17–22, late night 22–05; see lib/orbit-greeting).
   */
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingLateNight: string;
  /** Shown after the greeting; one is drawn at random on each visit (lib/orbit-welcome). */
  welcomeMessages: string[];
  /** Small note under the composer. */
  disclaimer: string;
  /** Orbit capabilities — each independently switchable in the CMS */
  voiceInput?: boolean;
  voicePlayback?: boolean;
  fileAttachments?: boolean;
  /** Voice fallback: record in the browser, transcribe with Workers AI Whisper */
  serverTranscription?: boolean;
  /** Spoken replies generated by Workers AI MeloTTS; off = the device's own voices */
  cloudVoice?: boolean;
}

export interface AssetMeta {
  url: string;
  alt?: string;
  updatedAt?: string;
}

export interface SiteAssets {
  profilePhoto: AssetMeta;
  /** retired single-variant slots (still read for compatibility, no longer editable) */
  logo: AssetMeta;
  favicon: AssetMeta;
  /** theme variants: Light = shown on the light theme (dark ink), Dark = on the dark theme */
  logoLight: AssetMeta;
  logoDark: AssetMeta;
  faviconLight: AssetMeta;
  faviconDark: AssetMeta;
}

export interface MaintenanceContent {
  enabled: boolean;
  showMessage: boolean;
  message: string;
  endsAt?: string | null;
}

export interface LaunchExperienceContent {
  enabled: boolean;
  primaryMessage: string;
  secondaryMessage: string;
  animation: "signal-wake";
  duration: number;
  showFrequency: "once" | "session" | "visit";
  startDate?: string | null;
  endDate?: string | null;
  launchVersion: string;
}

export interface TaxonomyContent {
  /** Admin-managed project categories. Existing project values stay valid even if not listed. */
  projectCategories: string[];
  /** Admin-managed blog categories (optional per post). */
  blogCategories: string[];
}

export { DEFAULT_BLOG_CATEGORIES, DEFAULT_PROJECT_CATEGORIES };

/** profilePhoto + theme variants; `logo` and `favicon` are the retired single-variant slots. */
export type AssetKey = "profilePhoto" | "logo" | "favicon" | "logoLight" | "logoDark" | "faviconLight" | "faviconDark";

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
  launchExperience: LaunchExperienceContent;
  taxonomy: TaxonomyContent;
  /** The one canonical availability (hero, footer, contact, resume, Orbit derive from it). */
  availability: AvailabilityContent;
  /** Per-page title/description overrides (empty = the page's built-in wording). */
  seo: SeoContent;
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
  | "maintenance"
  | "launchExperience"
  | "taxonomy"
  | "availability"
  | "seo";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  key: "main",
  assets: {
    profilePhoto: {
      url: BUNDLED.profilePhoto,
      alt: "Rushan Siddiqui : Full Stack Developer",
    },
    logo: {
      url: BUNDLED.logoDark,
      alt: "RAWIN Logo",
    },
    favicon: {
      url: BUNDLED.faviconDark,
      alt: "RAWIN Favicon",
    },
    logoLight: { url: BUNDLED.logoLight, alt: "RAWIN" },
    logoDark: { url: BUNDLED.logoDark, alt: "RAWIN" },
    faviconLight: { url: BUNDLED.faviconLight, alt: "RAWIN" },
    faviconDark: { url: BUNDLED.faviconDark, alt: "RAWIN" },
  },
  global: {
    brandName: "RAWIN",
    siteTitle: "Rushan Siddiqui : Full Stack Developer",
    shortBio:
      "Full Stack Developer building clean interfaces, thoughtful user experiences, and modern web applications.",
    footerAvailabilityBadge: "Available for collaboration",
    footerAvailabilityColor: "green",
    availabilityBadge: "Available for collaboration",
    availabilityStatus: "Open to opportunities",
    availabilityStatusColor: "green",
    footerCopyright: "© 2026 RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.",
    footerBulletNotification:
      "BUILDING WITH INTENT • CRAFTING DIGITAL EXPERIENCES • ALWAYS LEARNING",
    contactEmail: "rushansiddiqui5262@gmail.com",
    location: "Jaunpur, Uttar Pradesh, India",
    themeDefaultDesktop: "dark",
    themeDefaultMobile: "light",
    backgroundSoundEnabled: true,
    clickSoundEnabled: true,
  },
  home: {
    heroStatus: "Open to opportunities",
    heroBadge: "Available for hire",
    heroStatusColor: "green",
    heroTitlePrefix: "Hi, I'm",
    heroName: "Rushan Siddiqui",
    heroBio:
      "Building fast, thoughtful web applications with Next.js, TypeScript, and modern design systems. Focused on clean code and great user experience.",
    heroPrimaryCtaText: "Explore Case Studies",
    heroSecondaryCtaText: "Let's Connect",
    featuredHeading: "Featured Case Studies",
    featuredDescription: "Selected Work",
    heroTypingPhrases: [
      "Full Stack Developer",
      "Creative Technologies",
      "UI/UX Designer",
    ],
    capabilities: DEFAULT_CAPABILITIES,
    values: DEFAULT_VALUES,
  },
  about: {
    eyebrow: "ABOUT",
    title: "About Rushan Siddiqui",
    subtitle: "Full Stack Developer & Digital Craftsman",
    narrativeEyebrow: "HOW I THINK",
    leadText:
      "I build for the web, starting with interfaces and gradually moving deeper into the systems behind them.",
    progressionItem1: "INTERFACE",
    progressionItem2: "PERFORMANCE",
    progressionItem3: "SYSTEMS",
    narrativeText:
      "What began as an early curiosity with layouts and styling has grown into a disciplined focus on the entire web stack: from accessible, fluid interface design and frontend performance to type-safe APIs and modern application architecture.",
    metadataItem1: "UI",
    metadataItem2: "FRONTEND",
    metadataItem3: "BACKEND",
    metadataItem4: "ARCHITECTURE",
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
        preview: BUNDLED_EVOLUTION["2022"],
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
        preview: BUNDLED_EVOLUTION["2023"],
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
        preview: BUNDLED_EVOLUTION["2026"],
        previewAlt: "RAWIN 3.0 (2026) preview",
        ctaText: "YOU ARE HERE",
        displayOrder: 3,
      },
    ],
    milestoneLabels: {
      milestone01: "2022 Milestone",
      milestone02: "2023 Milestone",
      milestone03: "2026 Milestone",
      currentEra: "CURRENT ERA",
    },
    principlesEyebrow: "HOW I BUILD",
    principlesHeading: "A few principles I keep close.",
    principlesDescription: "Core rules that govern every line of code, architectural decision, and user experience.",
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
    journey: DEFAULT_JOURNEY,
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
      instagram: "",
    },
    form: {
      namePlaceholder: "Jane Doe",
      emailPlaceholder: "jane@example.com",
      phonePlaceholder: "+1 555 0192",
      subjectPlaceholder: "Project Inquiry / Job Opportunity",
      messagePlaceholder: "Describe your goals, project timeline, or questions...",
    },
    responseTime: "Usually within a day",
    successTitle: "Message Sent Successfully",
    successMessage:
      "Thank you for reaching out! Your message has been sent. I will review it and get back to you shortly.",
  },
  resume: {
    eyebrow: "RESUME / PROFILE · 2026",
    title: "Rushan Siddiqui",
    subtitle: "Full Stack Developer · Web Craftsman",
    summary:
      "Full stack developer focused on building fast, reliable web applications with Next.js, TypeScript, and modern backend systems. Passionate about interface craft, performance, and writing clean, maintainable code.",
    ctaText: "Hire Me",
    pdfLabel: "Download PDF",
    profileLabel: "Profile",
    skillsLabel: "Technical skills",
    experienceLabel: "Experience",
    educationLabel: "Education",
    ctaEyebrow: "Next chapter",
    indexLabel: "Contents",
    statusLabel: "Status",
    roleLabel: "Current role",
    locationLabel: "Based in",
    sinceLabel: "Building since",
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
    ledgerLabel: "Ledger",
    updatedYear: "2026",
    updateLabel: "UPDATED REGULARLY",
    dailyStack: [
      {
        id: "daily-vscode",
        name: "VS Code",
        category: "Editor",
        description: "Primary editor for everyday development.",
        icon: "code",
        order: 1,
        enabled: true,
      },
      {
        id: "daily-antigravity",
        name: "Antigravity",
        category: "AI & Workspace",
        description: "AI-assisted development, project exploration, and rapid iteration.",
        icon: "bot",
        order: 2,
        enabled: true,
      },
      {
        id: "daily-terminal",
        name: "Windows Terminal / PowerShell",
        category: "Terminal",
        description: "Git, npm, scripts, system tasks, and project automation.",
        icon: "terminal",
        order: 3,
        enabled: true,
      },
      {
        id: "daily-chrome",
        name: "Chrome",
        category: "Browser",
        description: "Responsive testing, DevTools, debugging, and research.",
        icon: "globe",
        order: 4,
        enabled: true,
      },
      {
        id: "daily-figma",
        name: "Figma",
        category: "Design",
        description: "UI exploration, layouts, visual systems, and prototypes.",
        icon: "palette",
        order: 5,
        enabled: true,
      },
      {
        id: "daily-git",
        name: "Git / GitHub",
        category: "Version Control",
        description: "Version control, project history, and collaboration.",
        icon: "git",
        order: 6,
        enabled: true,
      },
    ],
    developmentStack: [
      {
        id: "dev-1",
        name: "Next.js",
        description: "Application architecture, routing, server rendering, and APIs.",
        category: "Framework",
        icon: "layers",
        group: "Core Architecture",
        displayOrder: 1,
        enabled: true,
      },
      {
        id: "dev-2",
        name: "React",
        description: "Reusable interfaces and interactive components.",
        category: "UI Library",
        icon: "code",
        group: "Core Architecture",
        displayOrder: 2,
        enabled: true,
      },
      {
        id: "dev-3",
        name: "TypeScript",
        description: "Typed application logic and safer component development.",
        category: "Language",
        icon: "cpu",
        group: "Core Architecture",
        displayOrder: 3,
        enabled: true,
      },
      {
        id: "dev-4",
        name: "Tailwind CSS",
        description: "Responsive styling and reusable design patterns.",
        category: "Styling",
        icon: "palette",
        group: "Core Architecture",
        displayOrder: 4,
        enabled: true,
      },
      {
        id: "dev-5",
        name: "MongoDB",
        description: "Portfolio, project, blog, and CMS data.",
        category: "Database",
        icon: "database",
        group: "Data & Infrastructure",
        displayOrder: 5,
        enabled: true,
      },
      {
        id: "dev-6",
        name: "Framer Motion",
        description: "Interface motion and micro-interactions.",
        category: "Animation",
        icon: "zap",
        group: "Motion & Interaction",
        displayOrder: 6,
        enabled: true,
      },
      {
        id: "dev-7",
        name: "Lenis",
        description: "Smooth scrolling and scroll-driven experiences.",
        category: "Scroll",
        icon: "activity",
        group: "Motion & Interaction",
        displayOrder: 7,
        enabled: true,
      },
      {
        id: "dev-8",
        name: "Cloudflare Workers / AI",
        description: "Experiments with edge functions and AI workloads.",
        category: "Edge Compute",
        icon: "compass",
        group: "Data & Infrastructure",
        displayOrder: 8,
        enabled: true,
      },
      {
        id: "dev-9",
        name: "Git / GitHub",
        description: "Version control, project history, and collaboration.",
        category: "Source Control",
        icon: "git",
        group: "Version Control",
        displayOrder: 9,
        enabled: true,
      },
    ],
    howIBuild: [
      {
        id: "build-01",
        step: "01",
        title: "Explore",
        description: "Break down the problem and research what matters.",
        order: 1,
        enabled: true,
      },
      {
        id: "build-02",
        step: "02",
        title: "Design",
        description: "Shape the interface before adding unnecessary complexity.",
        order: 2,
        enabled: true,
      },
      {
        id: "build-03",
        step: "03",
        title: "Build",
        description: "Turn the system into reusable, maintainable components.",
        order: 3,
        enabled: true,
      },
      {
        id: "build-04",
        step: "04",
        title: "Refine",
        description: "Test interaction, responsiveness, accessibility, and performance.",
        order: 4,
        enabled: true,
      },
      {
        id: "build-05",
        step: "05",
        title: "Ship",
        description: "Deploy, observe, iterate, and improve.",
        order: 5,
        enabled: true,
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
    inputPlaceholder: "Ask Orbit",
    mobileComposerPlaceholder: "Ask Orbit",
    desktopComposerPlaceholder: "Only Ask Orbit",
    greetingMorning: "Good morning.",
    greetingAfternoon: "Good afternoon.",
    greetingEvening: "Good evening.",
    greetingLateNight: "Still up?",
    welcomeMessages: [...DEFAULT_WELCOME_MESSAGES],
    disclaimer: "Orbit is an AI assistant. It can make mistakes.",
  },
  maintenance: {
    enabled: false,
    showMessage: false,
    message: "We'll be back shortly.",
    endsAt: null,
  },
  launchExperience: {
    enabled: false,
    primaryMessage: "RAWIN v3.0",
    secondaryMessage: "A new iteration is live.",
    animation: "signal-wake",
    duration: 12.0,
    showFrequency: "once",
    startDate: "2026-09-21",
    endDate: "2026-10-12",
    launchVersion: "2026-v3-launch",
  },
  taxonomy: {
    projectCategories: DEFAULT_PROJECT_CATEGORIES,
    blogCategories: DEFAULT_BLOG_CATEGORIES,
  },
  availability: DEFAULT_AVAILABILITY,
  seo: normalizeSeo(null),
};

export { splitLedgerDescription };

/** Whether maintenance/offline is in force right now (a timed window may have ended since caching). */
export function maintenanceActiveNow(m: MaintenanceContent | undefined): boolean {
  if (!m?.enabled) return false;
  if (!m.endsAt) return true;
  const end = new Date(m.endsAt).getTime();
  return Number.isNaN(end) || end > Date.now();
}

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
    instagram:
      doc.contact?.socials?.instagram !== undefined
        ? doc.contact.socials.instagram
        : (DEFAULT_SITE_CONTENT.contact.socials.instagram || ""),
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
      footerAvailabilityBadge:
        doc.global?.footerAvailabilityBadge ||
        doc.global?.availabilityBadge ||
        DEFAULT_SITE_CONTENT.global.footerAvailabilityBadge,
      footerAvailabilityColor:
        (doc.global?.footerAvailabilityColor as "green" | "orange" | "red") ||
        (doc.global?.availabilityStatusColor as "green" | "orange" | "red") ||
        "green",
      availabilityBadge:
        doc.global?.footerAvailabilityBadge ||
        doc.global?.availabilityBadge ||
        DEFAULT_SITE_CONTENT.global.footerAvailabilityBadge,
      availabilityStatus: doc.global?.availabilityStatus || DEFAULT_SITE_CONTENT.global.availabilityStatus,
      availabilityStatusColor:
        (doc.global?.footerAvailabilityColor as "green" | "orange" | "red") ||
        (doc.global?.availabilityStatusColor as "green" | "orange" | "red") ||
        "green",
      footerCopyright: doc.global?.footerCopyright || DEFAULT_SITE_CONTENT.global.footerCopyright,
      footerBulletNotification:
        (doc.global?.footerBulletNotification || DEFAULT_SITE_CONTENT.global.footerBulletNotification || "")
          .trim()
          .slice(0, 300),
      footerClosingLabel:
        typeof doc.global?.footerClosingLabel === "string" ? doc.global.footerClosingLabel.trim().slice(0, 40) : "",
      closingInvite: (typeof doc.global?.closingInvite === "string" && doc.global.closingInvite.trim()) || DEFAULT_CLOSING.closingInvite,
      closingPrompt: (typeof doc.global?.closingPrompt === "string" && doc.global.closingPrompt.trim()) || DEFAULT_CLOSING.closingPrompt,
      closingCta: (typeof doc.global?.closingCta === "string" && doc.global.closingCta.trim()) || DEFAULT_CLOSING.closingCta,
      contactEmail: canonicalEmail,
      location: canonicalLocation,
      headerBrand: doc.global?.headerBrand === "logo" ? "logo" : "wordmark",
      // missing or invalid values fall back to the shipped defaults (desktop dark, phones light)
      themeDefaultDesktop: doc.global?.themeDefaultDesktop === "light" ? "light" : "dark",
      backgroundSoundEnabled: readFlag(doc.global?.backgroundSoundEnabled, true),
      clickSoundEnabled: readFlag(doc.global?.clickSoundEnabled, true),
      themeDefaultMobile: doc.global?.themeDefaultMobile === "dark" ? "dark" : "light",
    },
    home: {
      heroStatus: doc?.home?.heroStatus || DEFAULT_SITE_CONTENT.home.heroStatus,
      heroBadge: doc?.home?.heroBadge || DEFAULT_SITE_CONTENT.home.heroBadge,
      heroStatusColor:
        (doc?.home?.heroStatusColor as "green" | "orange" | "red") ||
        "green",
      heroTitlePrefix: doc?.home?.heroTitlePrefix || DEFAULT_SITE_CONTENT.home.heroTitlePrefix,
      heroName: doc?.home?.heroName || DEFAULT_SITE_CONTENT.home.heroName,
      heroBio: doc?.home?.heroBio || DEFAULT_SITE_CONTENT.home.heroBio,
      heroPrimaryCtaText: doc?.home?.heroPrimaryCtaText || DEFAULT_SITE_CONTENT.home.heroPrimaryCtaText,
      heroSecondaryCtaText: doc?.home?.heroSecondaryCtaText || DEFAULT_SITE_CONTENT.home.heroSecondaryCtaText,
      featuredHeading: doc?.home?.featuredHeading || DEFAULT_SITE_CONTENT.home.featuredHeading,
      featuredDescription: doc?.home?.featuredDescription || DEFAULT_SITE_CONTENT.home.featuredDescription || "",
      heroTypingPhrases:
        Array.isArray(doc?.home?.heroTypingPhrases) && doc.home.heroTypingPhrases.length > 0
          ? doc.home.heroTypingPhrases
              .map((p: any) => String(p).trim())
              .filter(Boolean)
          : DEFAULT_SITE_CONTENT.home.heroTypingPhrases,
      showCapabilities: readFlag(doc?.home?.showCapabilities, true),
      showValues: readFlag(doc?.home?.showValues, true),
      showJourney: readFlag(doc?.home?.showJourney, true),
      showHeroFocus: readFlag(doc?.home?.showHeroFocus, true),
      showHeroAvailability: readFlag(doc?.home?.showHeroAvailability, true),
      showHeroWork: readFlag(doc?.home?.showHeroWork, true),
      capabilities: normalizeCapabilities(doc?.home?.capabilities),
      values: normalizeValues(doc?.home?.values),
    },
    about: {
      eyebrow: doc.about?.eyebrow || DEFAULT_SITE_CONTENT.about.eyebrow,
      title: doc.about?.title || DEFAULT_SITE_CONTENT.about.title,
      subtitle: doc.about?.subtitle || DEFAULT_SITE_CONTENT.about.subtitle,
      narrativeEyebrow:
        typeof doc.about?.narrativeEyebrow === "string" && doc.about.narrativeEyebrow.trim()
          ? doc.about.narrativeEyebrow.trim()
          : DEFAULT_SITE_CONTENT.about.narrativeEyebrow,
      leadText: doc.about?.leadText || DEFAULT_SITE_CONTENT.about.leadText,
      narrativeText: doc.about?.narrativeText || DEFAULT_SITE_CONTENT.about.narrativeText,
      progressionItem1:
        typeof doc.about?.progressionItem1 === "string" && doc.about.progressionItem1.trim()
          ? doc.about.progressionItem1.trim()
          : DEFAULT_SITE_CONTENT.about.progressionItem1,
      progressionItem2:
        typeof doc.about?.progressionItem2 === "string" && doc.about.progressionItem2.trim()
          ? doc.about.progressionItem2.trim()
          : DEFAULT_SITE_CONTENT.about.progressionItem2,
      progressionItem3:
        typeof doc.about?.progressionItem3 === "string" && doc.about.progressionItem3.trim()
          ? doc.about.progressionItem3.trim()
          : DEFAULT_SITE_CONTENT.about.progressionItem3,
      metadataItem1:
        typeof doc.about?.metadataItem1 === "string" && doc.about.metadataItem1.trim()
          ? doc.about.metadataItem1.trim()
          : DEFAULT_SITE_CONTENT.about.metadataItem1,
      metadataItem2:
        typeof doc.about?.metadataItem2 === "string" && doc.about.metadataItem2.trim()
          ? doc.about.metadataItem2.trim()
          : DEFAULT_SITE_CONTENT.about.metadataItem2,
      metadataItem3:
        typeof doc.about?.metadataItem3 === "string" && doc.about.metadataItem3.trim()
          ? doc.about.metadataItem3.trim()
          : DEFAULT_SITE_CONTENT.about.metadataItem3,
      metadataItem4:
        typeof doc.about?.metadataItem4 === "string" && doc.about.metadataItem4.trim()
          ? doc.about.metadataItem4.trim()
          : DEFAULT_SITE_CONTENT.about.metadataItem4,
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
          // retired /images/* paths resolve to the bundled screenshots
          preview: resolveAssetUrl(m.preview, evolutionFallback(m.year, m.id)),
          previewAlt: typeof m.previewAlt === "string" ? m.previewAlt : `${m.title || ""} (${m.year || ""}) preview`,
          ctaText: String(m.ctaText || (m.isCurrent ? "YOU ARE HERE" : "VIEW WEBSITE")),
          displayOrder: typeof m.displayOrder === "number" ? m.displayOrder : idx + 1,
        }))
        : DEFAULT_SITE_CONTENT.about.evolution,
      milestoneLabels: {
        milestone01:
          typeof doc.about?.milestoneLabels?.milestone01 === "string" && doc.about.milestoneLabels.milestone01.trim()
            ? doc.about.milestoneLabels.milestone01.trim().slice(0, 80)
            : DEFAULT_SITE_CONTENT.about.milestoneLabels?.milestone01 || "2022 Milestone",
        milestone02:
          typeof doc.about?.milestoneLabels?.milestone02 === "string" && doc.about.milestoneLabels.milestone02.trim()
            ? doc.about.milestoneLabels.milestone02.trim().slice(0, 80)
            : DEFAULT_SITE_CONTENT.about.milestoneLabels?.milestone02 || "2023 Milestone",
        milestone03:
          typeof doc.about?.milestoneLabels?.milestone03 === "string" && doc.about.milestoneLabels.milestone03.trim()
            ? doc.about.milestoneLabels.milestone03.trim().slice(0, 80)
            : DEFAULT_SITE_CONTENT.about.milestoneLabels?.milestone03 || "2026 Milestone",
        currentEra:
          typeof doc.about?.milestoneLabels?.currentEra === "string" && doc.about.milestoneLabels.currentEra.trim()
            ? doc.about.milestoneLabels.currentEra.trim().slice(0, 80)
            : DEFAULT_SITE_CONTENT.about.milestoneLabels?.currentEra || "CURRENT ERA",
      },
      principlesEyebrow: doc?.about?.principlesEyebrow || DEFAULT_SITE_CONTENT.about.principlesEyebrow,
      principlesHeading: doc?.about?.principlesHeading || DEFAULT_SITE_CONTENT.about.principlesHeading,
      principlesDescription:
        typeof doc?.about?.principlesDescription === "string" && doc.about.principlesDescription.trim()
          ? doc.about.principlesDescription.trim()
          : DEFAULT_SITE_CONTENT.about.principlesDescription || "",
      principles: Array.isArray(doc?.about?.principles) && doc.about.principles.length > 0
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
      journey: normalizeJourney(doc.about?.journey),
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
      responseTime: doc.contact?.responseTime || DEFAULT_SITE_CONTENT.contact.responseTime,
    },
    resume: {
      eyebrow: doc.resume?.eyebrow || DEFAULT_SITE_CONTENT.resume.eyebrow,
      title: doc.resume?.title || DEFAULT_SITE_CONTENT.resume.title,
      subtitle: doc.resume?.subtitle || DEFAULT_SITE_CONTENT.resume.subtitle,
      summary: doc.resume?.summary || DEFAULT_SITE_CONTENT.resume.summary,
      ctaText: doc.resume?.ctaText || DEFAULT_SITE_CONTENT.resume.ctaText,
      pdfLabel: doc.resume?.pdfLabel || DEFAULT_SITE_CONTENT.resume.pdfLabel,
      profileLabel: doc.resume?.profileLabel || DEFAULT_SITE_CONTENT.resume.profileLabel,
      skillsLabel: doc.resume?.skillsLabel || DEFAULT_SITE_CONTENT.resume.skillsLabel,
      experienceLabel: doc.resume?.experienceLabel || DEFAULT_SITE_CONTENT.resume.experienceLabel,
      educationLabel: doc.resume?.educationLabel || DEFAULT_SITE_CONTENT.resume.educationLabel,
      ctaEyebrow: doc.resume?.ctaEyebrow || DEFAULT_SITE_CONTENT.resume.ctaEyebrow,
      indexLabel: doc.resume?.indexLabel || DEFAULT_SITE_CONTENT.resume.indexLabel,
      statusLabel: doc.resume?.statusLabel || DEFAULT_SITE_CONTENT.resume.statusLabel,
      roleLabel: doc.resume?.roleLabel || DEFAULT_SITE_CONTENT.resume.roleLabel,
      locationLabel: doc.resume?.locationLabel || DEFAULT_SITE_CONTENT.resume.locationLabel,
      sinceLabel: doc.resume?.sinceLabel || DEFAULT_SITE_CONTENT.resume.sinceLabel,
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
      ...(() => {
        // Older documents store the year inside the description ("UPDATED REGULARLY · 2026");
        // the dedicated year field wins, the embedded year is only a fallback.
        const legacy = splitLedgerDescription(doc.uses?.updateLabel);
        return {
          ledgerLabel: doc.uses?.ledgerLabel || DEFAULT_SITE_CONTENT.uses.ledgerLabel,
          updatedYear: doc.uses?.updatedYear || legacy.year || DEFAULT_SITE_CONTENT.uses.updatedYear,
          updateLabel: legacy.description || DEFAULT_SITE_CONTENT.uses.updateLabel,
        };
      })(),
      dailyStack:
        Array.isArray(doc.uses?.dailyStack) && doc.uses.dailyStack.length > 0
          ? doc.uses.dailyStack
          : DEFAULT_SITE_CONTENT.uses.dailyStack,
      developmentStack:
        Array.isArray(doc.uses?.developmentStack) && doc.uses.developmentStack.length > 0
          ? doc.uses.developmentStack
          : DEFAULT_SITE_CONTENT.uses.developmentStack,
      howIBuild:
        Array.isArray(doc.uses?.howIBuild) && doc.uses.howIBuild.length > 0
          ? doc.uses.howIBuild
          : DEFAULT_SITE_CONTENT.uses.howIBuild,
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
      eyebrow: doc.ai?.eyebrow || DEFAULT_SITE_CONTENT.ai.eyebrow,
      title: doc.ai?.title || DEFAULT_SITE_CONTENT.ai.title,
      description: doc.ai?.description || DEFAULT_SITE_CONTENT.ai.description,
      greetingMessage: doc.ai?.greetingMessage || DEFAULT_SITE_CONTENT.ai.greetingMessage,
      inputPlaceholder: doc.ai?.inputPlaceholder || DEFAULT_SITE_CONTENT.ai.inputPlaceholder,
      mobileComposerPlaceholder:
        doc.ai?.mobileComposerPlaceholder ||
        DEFAULT_SITE_CONTENT.ai.mobileComposerPlaceholder,
      desktopComposerPlaceholder:
        doc.ai?.desktopComposerPlaceholder ||
        DEFAULT_SITE_CONTENT.ai.desktopComposerPlaceholder,
      // (legacy suggestedPrompts / suggestedPromptsLabel values in stored documents are no
      // longer read: the welcome greets by local time instead)
      greetingMorning: doc.ai?.greetingMorning || DEFAULT_SITE_CONTENT.ai.greetingMorning,
      greetingAfternoon: doc.ai?.greetingAfternoon || DEFAULT_SITE_CONTENT.ai.greetingAfternoon,
      greetingEvening: doc.ai?.greetingEvening || DEFAULT_SITE_CONTENT.ai.greetingEvening,
      greetingLateNight: doc.ai?.greetingLateNight || DEFAULT_SITE_CONTENT.ai.greetingLateNight,
      // never saved → the default library; saved but unusable → a small fallback set
      welcomeMessages: welcomeMessagesFrom(doc.ai?.welcomeMessages),
      disclaimer: doc.ai?.disclaimer || DEFAULT_SITE_CONTENT.ai.disclaimer,
      // Browser-native voice features default on; file attachments send content to the
      // model, so they stay off until an administrator enables them.
      voiceInput: readFlag(doc.ai?.voiceInput, true),
      voicePlayback: readFlag(doc.ai?.voicePlayback, true),
      fileAttachments: readFlag(doc.ai?.fileAttachments, false),
      // Sends short voice recordings to Workers AI; off until an administrator enables it.
      serverTranscription: readFlag(doc.ai?.serverTranscription, false),
      // MeloTTS on the existing Workers AI account (free daily allocation); on by default
      cloudVoice: readFlag(doc.ai?.cloudVoice, true),
    },
    // Stored URLs pass through resolveAssetUrl: retired paths (/images/*, /favicon.svg,
    // /brand/rawin-logo*.svg) map to the bundled files, and empty slots use them directly.
    assets: {
      profilePhoto: assetMeta(doc.assets?.profilePhoto, BUNDLED.profilePhoto, DEFAULT_SITE_CONTENT.assets.profilePhoto.alt),
      logo: assetMeta(doc.assets?.logo, BUNDLED.logoDark, "RAWIN Logo"),
      favicon: assetMeta(doc.assets?.favicon, BUNDLED.faviconDark, "RAWIN Favicon"),
      logoLight: assetMeta(doc.assets?.logoLight, BUNDLED.logoLight, "RAWIN"),
      logoDark: assetMeta(doc.assets?.logoDark, BUNDLED.logoDark, "RAWIN"),
      faviconLight: assetMeta(doc.assets?.faviconLight, BUNDLED.faviconLight, "RAWIN"),
      faviconDark: assetMeta(doc.assets?.faviconDark, BUNDLED.faviconDark, "RAWIN"),
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
    launchExperience: {
      enabled:
        typeof doc.launchExperience?.enabled === "boolean"
          ? doc.launchExperience.enabled
          : DEFAULT_SITE_CONTENT.launchExperience.enabled,
      primaryMessage:
        typeof doc.launchExperience?.primaryMessage === "string" && doc.launchExperience.primaryMessage.trim()
          ? doc.launchExperience.primaryMessage.trim()
          : DEFAULT_SITE_CONTENT.launchExperience.primaryMessage,
      secondaryMessage:
        typeof doc.launchExperience?.secondaryMessage === "string"
          ? doc.launchExperience.secondaryMessage.trim()
          : DEFAULT_SITE_CONTENT.launchExperience.secondaryMessage,
      animation: "signal-wake",
      duration:
        typeof doc.launchExperience?.duration === "number" && doc.launchExperience.duration > 0
          ? doc.launchExperience.duration
          : DEFAULT_SITE_CONTENT.launchExperience.duration,
      showFrequency:
        ["once", "session", "visit"].includes(doc.launchExperience?.showFrequency)
          ? doc.launchExperience.showFrequency
          : DEFAULT_SITE_CONTENT.launchExperience.showFrequency,
      startDate:
        typeof doc.launchExperience?.startDate === "string" && doc.launchExperience.startDate.trim()
          ? doc.launchExperience.startDate.trim()
          : (doc.launchExperience?.startDate === null ? null : DEFAULT_SITE_CONTENT.launchExperience.startDate),
      endDate:
        typeof doc.launchExperience?.endDate === "string" && doc.launchExperience.endDate.trim()
          ? doc.launchExperience.endDate.trim()
          : (doc.launchExperience?.endDate === null ? null : DEFAULT_SITE_CONTENT.launchExperience.endDate),
      launchVersion:
        typeof doc.launchExperience?.launchVersion === "string" && doc.launchExperience.launchVersion.trim()
          ? doc.launchExperience.launchVersion.trim()
          : DEFAULT_SITE_CONTENT.launchExperience.launchVersion,
    },
    availability: normalizeAvailability(doc),
    seo: normalizeSeo(doc.seo),
    taxonomy: {
      projectCategories: readStringList(doc.taxonomy?.projectCategories, DEFAULT_PROJECT_CATEGORIES),
      blogCategories: readStringList(doc.taxonomy?.blogCategories, DEFAULT_BLOG_CATEGORIES),
    },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

function assetMeta(stored: any, fallbackUrl: string, fallbackAlt?: string): AssetMeta {
  return {
    url: resolveAssetUrl(stored?.url, fallbackUrl),
    alt: (typeof stored?.alt === "string" && stored.alt.trim()) || fallbackAlt || "",
    updatedAt: typeof stored?.updatedAt === "string" ? stored.updatedAt : undefined,
  };
}

function readFlag(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function readStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of value) {
    const v = String(item ?? "").trim().slice(0, 60);
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      list.push(v);
    }
  }
  return list.length ? list : fallback;
}

/**
 * Retrieves site content from MongoDB with graceful fallback.
 * Strictly READ-ONLY for public requests - never mutates the database.
 */
async function fetchSiteContentFromDb(): Promise<SiteContent> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("[SiteContent] Database connection unavailable.");
  }

  const col = db.collection(COLLECTION_NAME);
  const doc = await col.findOne({ key: "main" });

  if (!doc) {
    return mergeWithDefaults(null);
  }

  // In-memory maintenance expiration check (zero public DB writes)
  if (doc.maintenance?.enabled && doc.maintenance?.endsAt) {
    const endsTime = new Date(doc.maintenance.endsAt).getTime();
    if (!isNaN(endsTime) && endsTime <= Date.now()) {
      doc.maintenance.enabled = false;
      doc.maintenance.endsAt = null;
    }
  }

  return mergeWithDefaults(doc);
}

/**
 * Version of the normalised content shape. The data cache persists across builds, so an entry
 * written before a field was added would otherwise be served without it until it expires:
 * bump this whenever mergeWithDefaults gains or changes fields.
 */
const SITE_CONTENT_SHAPE = "2026-10-20";

const getCachedSiteContent = unstable_cache(
  async () => fetchSiteContentFromDb(),
  ["site-content-cache", SITE_CONTENT_SHAPE],
  {
    tags: ["site-content"],
    revalidate: 3600,
  }
);

/**
 * The public site content (tag-cached). Throws when the content cannot be read and no cached
 * copy exists: built-in defaults are never substituted, because a page rendered from them would
 * be cached as if it were the stored content, and their maintenance setting ("off") would open
 * a site that may be offline. A static page whose regeneration throws keeps serving its last
 * good version; callers that can do without content (the root shell, APIs) catch explicitly.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    return await getCachedSiteContent();
  } catch (err: unknown) {
    console.error("[SiteContent] Content unavailable:", err instanceof Error ? err.name : "unknown");
    throw new Error("Site content is temporarily unavailable.");
  }
});

/**
 * How long a page rendered while maintenance or offline mode is on may be cached (seconds). The
 * maintenance decision is made from the cached content when a page is rendered, so a page
 * rendered during maintenance must not live for the usual hour: if a cache purge after a Studio
 * change is lost, or a timed window ends with nobody saving anything, the page still converges
 * within this window.
 */
export const MAINTENANCE_PAGE_TTL = 30;

/** The same for a page rendered while the content could not be read at all (seconds). */
export const UNAVAILABLE_PAGE_TTL = 10;

const maintenanceWindowMarker = unstable_cache(async () => true, ["maintenance-page-ttl"], {
  revalidate: MAINTENANCE_PAGE_TTL,
});
const unavailableMarker = unstable_cache(async () => true, ["unavailable-page-ttl"], {
  revalidate: UNAVAILABLE_PAGE_TTL,
});

/**
 * Called by the public layout while maintenance is on: a cached read with a short lifetime,
 * which lowers the revalidation period of the page being rendered to MAINTENANCE_PAGE_TTL
 * (Next.js uses the shortest lifetime of the cached reads a static render makes).
 */
export async function shortenPageLifetimeForMaintenance(): Promise<void> {
  await maintenanceWindowMarker().catch(() => undefined);
}

/** As above, for the "temporarily unavailable" screen (UNAVAILABLE_PAGE_TTL). */
export async function shortenPageLifetimeForUnavailable(): Promise<void> {
  await unavailableMarker().catch(() => undefined);
}

/**
 * Whether a public page must render nothing of its own: maintenance or offline mode is on, or
 * the setting cannot be read (unknown is treated as closed, never as live). Next.js renders a
 * page in parallel with its layout, so the layout showing the maintenance screen does not stop
 * the page's own queries; each public page (and its metadata) checks this first, so a failing
 * project, post or analytics query can never break the maintenance screen.
 */
export async function publicSiteClosed(): Promise<boolean> {
  try {
    return maintenanceActiveNow((await getSiteContent()).maintenance);
  } catch {
    return true;
  }
}

/**
 * Uncached read for the admin: editors start from what is stored right now, not from the
 * public cache. Read-only; throws when the database is unreachable.
 */
export const getSiteContentFresh = cache(async (): Promise<SiteContent> => fetchSiteContentFromDb());

/**
 * Updates a specific section of the site content in MongoDB.
 */
export async function updateSiteSection<K extends ContentSectionKey>(
  section: K,
  data: Partial<SiteContent[K]>
): Promise<boolean> {
  try {
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

    if (data === null || data === undefined || typeof data !== "object") {
      return false;
    }

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

    try {
      invalidateCacheTag("site-content");
    } catch {
      // Ignore outside request context
    }

    // stored only when the write reached the content document (updated, or created by the upsert)
    return result.acknowledged && (result.matchedCount === 1 || result.upsertedCount === 1);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SiteContent] Error updating section (${section}):`, msg);
    throw new Error(msg);
  }
}

const ASSET_BUCKET_NAME = "site_assets";

/**
 * Stores an uploaded asset file buffer into MongoDB GridFS using atomic replacement.
 * 1. Uploads new binary stream first to obtain new GridFS ObjectId.
 * 2. Updates site_content document with the immutable path-based URL (/api/assets/${assetType}/${fileId}).
 * 3. Deletes prior files for this assetType ONLY after MongoDB update succeeds.
 * 4. If MongoDB update fails, rolls back newly uploaded GridFS file.
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

  // 1. Upload new file stream into GridFS FIRST
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

  const fileId = uploadStream.id.toString();
  const url = `/api/assets/${assetType}/${fileId}`;
  const now = new Date();

  // 2. Update site_content document with the asset URL reference
  const col = db.collection(COLLECTION_NAME);
  const updatePayload: Record<string, any> = {
    [`assets.${assetType}.url`]: url,
    [`assets.${assetType}.updatedAt`]: now.toISOString(),
    updatedAt: now,
  };
  if (alt !== undefined && alt.trim() !== "") {
    updatePayload[`assets.${assetType}.alt`] = alt.trim();
  }

  try {
    await col.updateOne({ key: "main" }, { $set: updatePayload }, { upsert: true });
  } catch (dbErr) {
    // Rollback: delete newly uploaded file if DB update fails
    await bucket.delete(uploadStream.id).catch(() => {});
    throw dbErr;
  }

  // 3. Delete prior GridFS files for this assetType ONLY after successful DB update
  try {
    const existingFiles = await bucket
      .find({
        "metadata.assetType": assetType,
        _id: { $ne: uploadStream.id },
      })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => { });
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Clean prior asset notice:", cleanErr);
  }

  try {
    invalidateCacheTag("site-content");
  } catch {
    // Ignore outside request context
  }

  return { fileId, url };
}

/**
 * Retrieves an asset file stream and metadata from MongoDB GridFS.
 * When fileId is supplied, retrieves the exact file by its GridFS ObjectId.
 * When fileId is omitted, falls back to the most recent file for the assetType (legacy compatibility).
 */
export async function getAssetFile(
  assetType: AssetKey | string,
  fileId?: string
): Promise<{ stream: Readable; contentType: string; filename: string } | null> {
  const db = await getDatabase();
  if (!db) return null;

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
  let file: any = null;

  if (fileId) {
    if (!ObjectId.isValid(fileId)) return null;
    const files = await bucket
      .find({ _id: new ObjectId(fileId) })
      .limit(1)
      .toArray();
    if (files && files.length > 0) {
      file = files[0];
    }
  } else {
    // Legacy fallback: retrieve newest file for assetType
    const files = await bucket
      .find({ "metadata.assetType": assetType })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();
    if (files && files.length > 0) {
      file = files[0];
    }
  }

  if (!file) {
    return null;
  }

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

  try {
    invalidateCacheTag("site-content");
  } catch {
    // Ignore outside request context
  }

  return res.acknowledged;
}

/**
 * Resets an asset to its default known-good state.
 */
export async function resetAssetToDefault(assetType: AssetKey): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  const now = new Date();

  // 1. Point the slot at the built-in default first (an empty URL means "built-in";
  //    mergeWithDefaults supplies the bundled file). If this fails, nothing else changes.
  await db.collection(COLLECTION_NAME).updateOne(
    { key: "main" },
    {
      $set: {
        [`assets.${assetType}`]: {
          url: "",
          alt: "",
          updatedAt: now.toISOString(),
        },
        updatedAt: now,
      },
    }
  );

  // 2. Only then remove the uploaded files for this slot (never another slot's)
  try {
    const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
    const existingFiles = await bucket.find({ "metadata.assetType": assetType }).toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Reset asset cleanup notice:", cleanErr);
  }

  try {
    invalidateCacheTag("site-content");
  } catch {
    // Ignore outside request context
  }

  return true;
}

/**
 * Returns a saved milestone to its bundled screenshot (an empty preview resolves to the built-in
 * file for that year). The reference changes first; the uploaded file is deleted only afterwards.
 * Returns false when the milestone is not saved yet.
 */
export async function resetMilestoneImage(milestoneId: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const res = await db.collection(COLLECTION_NAME).updateOne(
    { key: "main", "about.evolution.id": milestoneId },
    { $set: { "about.evolution.$.preview": "", updatedAt: new Date() } }
  );
  if (res.matchedCount === 0) return false;

  try {
    const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
    const files = await bucket.find({ "metadata.assetType": `evolution-${milestoneId}` }).toArray();
    for (const file of files) await bucket.delete(file._id).catch(() => {});
  } catch (cleanErr) {
    console.warn("[SiteContent] Reset milestone cleanup notice:", cleanErr);
  }
  try {
    invalidateCacheTag("site-content");
  } catch {}
  return true;
}

/**
 * Stores an uploaded milestone image file buffer into MongoDB GridFS using atomic replacement.
 */
export async function storeMilestoneImage(
  milestoneId: string,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ url: string; linked: boolean }> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  const assetType = `evolution-${milestoneId}`;
  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });

  // 1. Upload the new file first
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

  const fileId = uploadStream.id.toString();
  const url = `/api/assets/${assetType}/${fileId}`;

  // 2. Point the saved milestone at it (if the milestone is saved already)
  let linked = false;
  try {
    const res = await db.collection(COLLECTION_NAME).updateOne(
      { key: "main", "about.evolution.id": milestoneId },
      { $set: { "about.evolution.$.preview": url, updatedAt: new Date() } }
    );
    linked = res.modifiedCount > 0;
  } catch (dbErr) {
    await bucket.delete(uploadStream.id).catch(() => {});
    throw dbErr;
  }

  // 3. Only a linked upload replaces the previous file; an unsaved milestone keeps both until
  //    the About section is saved (the editor holds the new URL)
  if (linked) {
    try {
      const existingFiles = await bucket
        .find({ "metadata.assetType": assetType, _id: { $ne: uploadStream.id } })
        .toArray();
      for (const file of existingFiles) {
        await bucket.delete(file._id).catch(() => {});
      }
    } catch (cleanErr) {
      console.warn("[SiteContent] Clean prior milestone image notice:", cleanErr);
    }
    try {
      invalidateCacheTag("site-content");
    } catch {}
  }

  return { url, linked };
}

const RESUME_PDF_ASSET_TYPE = "resumePdf";

/**
 * Stores an uploaded resume PDF file buffer into MongoDB GridFS and updates the resume.pdf metadata.
 * Uses atomic replacement: uploads binary first, updates database, then cleans up prior PDF files.
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

  // 1. Upload new file stream into GridFS FIRST
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
  const url = `/api/resume/download/${fileId}`;
  const now = new Date();

  // 2. Update site_content document
  const col = db.collection(COLLECTION_NAME);
  try {
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
  } catch (dbErr) {
    // Rollback: delete newly uploaded file if DB update fails
    await bucket.delete(uploadStream.id).catch(() => {});
    throw dbErr;
  }

  // 3. Delete prior GridFS files for resumePdf ONLY after DB update succeeds
  try {
    const existingFiles = await bucket
      .find({
        "metadata.assetType": RESUME_PDF_ASSET_TYPE,
        _id: { $ne: uploadStream.id },
      })
      .toArray();
    for (const file of existingFiles) {
      await bucket.delete(file._id).catch(() => { });
    }
  } catch (cleanErr) {
    console.warn("[SiteContent] Clean prior resume PDF notice:", cleanErr);
  }

  try {
    invalidateCacheTag("site-content");
  } catch {
    // Ignore outside request context
  }

  return { fileId, filename: sanitizedName, url, size };
}

/**
 * Retrieves the active resume PDF file stream and metadata from MongoDB GridFS.
 * When fileId is supplied, retrieves the exact file by its GridFS ObjectId.
 * When fileId is omitted, falls back to the fileId in site_content or latest resumePdf in GridFS.
 */
export async function getResumePdfFile(
  fileId?: string
): Promise<{
  stream: Readable;
  contentType: string;
  filename: string;
  size: number;
} | null> {
  const db = await getDatabase();
  if (!db) return null;

  const bucket = new GridFSBucket(db, { bucketName: ASSET_BUCKET_NAME });
  let targetObjectId: ObjectId | null = null;
  let filename = "Rushan-Siddiqui-Resume.pdf";

  if (fileId) {
    if (!ObjectId.isValid(fileId)) return null;
    targetObjectId = new ObjectId(fileId);
  } else {
    const col = db.collection(COLLECTION_NAME);
    const doc = await col.findOne({ key: "main" });
    if (doc?.resume?.pdf?.fileId && ObjectId.isValid(doc.resume.pdf.fileId)) {
      targetObjectId = new ObjectId(doc.resume.pdf.fileId);
      if (doc.resume.pdf.filename) {
        filename = doc.resume.pdf.filename;
      }
    }
  }

  let files: any[] = [];
  if (targetObjectId) {
    files = await bucket.find({ _id: targetObjectId }).limit(1).toArray();
  }

  // Fallback: if not found by ID or no ID, get newest resumePdf file in GridFS
  if (!files || files.length === 0) {
    files = await bucket
      .find({ "metadata.assetType": RESUME_PDF_ASSET_TYPE })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();
  }

  if (!files || files.length === 0) {
    return null;
  }

  const file = files[0];
  const stream = bucket.openDownloadStream(file._id);

  return {
    stream: stream as unknown as Readable,
    contentType: "application/pdf",
    filename: file.filename || filename,
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
      await bucket.delete(file._id).catch(() => { });
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

  try {
    invalidateCacheTag("site-content");
  } catch {
    // Ignore outside request context
  }

  return true;
}

export interface PublicAvailability {
  status: "live" | "offline" | "maintenance";
  message?: string;
  endsAt?: string | null;
  revision?: number;
  /** The CMS sound switches (global settings), so open pages follow a save without a reload. */
  sound?: { background: boolean; click: boolean };
}

/**
 * Lightweight query for public website availability status with zero sensitive data.
 * Automatically normalizes expired maintenance timers in MongoDB.
 */
async function fetchPublicAvailabilityFromDb(): Promise<PublicAvailability> {
  try {
    const db = await getDatabase();
    // Unknown is not "live": throw so nothing is cached and the caller keeps its current state
    if (!db) throw new Error("Database connection unavailable.");

    const col = db.collection(COLLECTION_NAME);
    const doc = await col.findOne(
      { key: "main" },
      { projection: { maintenance: 1, updatedAt: 1, "global.backgroundSoundEnabled": 1, "global.clickSoundEnabled": 1 } }
    );
    const revision = doc?.updatedAt instanceof Date
      ? doc.updatedAt.getTime()
      : (doc?.updatedAt ? new Date(doc.updatedAt).getTime() : 0);
    const sound = {
      background: readFlag(doc?.global?.backgroundSoundEnabled, true),
      click: readFlag(doc?.global?.clickSoundEnabled, true),
    };

    if (!doc?.maintenance?.enabled) {
      return { status: "live", revision, sound };
    }

    const maintenance = doc.maintenance;
    const endsAt = maintenance.endsAt;

    // Check if maintenance mode with timer has expired
    if (endsAt) {
      const endsTime = new Date(endsAt).getTime();
      if (!isNaN(endsTime) && endsTime <= Date.now()) {
        // Return live in-memory without performing public DB mutations
        return { status: "live", revision, sound };
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
        revision,
        sound,
      };
    }

    return {
      status: "offline",
      revision,
      sound,
    };
  } catch (err) {
    // the category only: driver errors can carry host names and topology details
    console.error("[getPublicAvailability] unavailable:", err instanceof Error ? err.name : "unknown");
    throw err;
  }
}

const getCachedPublicAvailability = unstable_cache(
  async () => fetchPublicAvailabilityFromDb(),
  // v2: the answer also carries the CMS sound switches (a new key, so no older shape is served)
  ["public-availability-cache-v2"],
  {
    tags: ["site-content"],
    revalidate: 60,
  }
);

export const getPublicAvailability = cache(async (): Promise<PublicAvailability> => {
  return getCachedPublicAvailability();
});

export async function getPublicAvailabilityFresh(): Promise<PublicAvailability> {
  return fetchPublicAvailabilityFromDb();
}



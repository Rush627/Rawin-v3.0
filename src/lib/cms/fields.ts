/* eslint-disable @typescript-eslint/no-explicit-any -- normalises untyped stored documents and JSON input */
/**
 * Content fields introduced by the admin overhaul, kept pure (no database, no Next imports) so
 * the normalisers and validators are unit-tested directly. lib/site-content.ts reads stored
 * documents through the normalisers; lib/cms/section-payload.ts validates admin submissions.
 *
 * Every field here is additive: a document that never stored it reads the shipped default, or
 * (for availability) a value derived from the legacy fields it replaces.
 */
import { TECH_ARSENAL } from "../../data/techArsenal";
import { TIMELINE, VALUE_PROPOSITIONS } from "../../data/experience";
import { AVAILABILITY_STATES, TONE_TO_STATE, type AvailabilityContent, type AvailabilityState } from "./availability";

export * from "./availability";
export { splitEmphasis } from "./text";

type Doc = Record<string, any> | null | undefined;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/* ------------------------------------------------------------------ availability */

export const DEFAULT_AVAILABILITY: AvailabilityContent = {
  state: "available",
  label: "Open to opportunities",
  note: "Available for collaboration",
};

/**
 * The canonical availability. A stored `availability` section wins; documents saved before it
 * existed derive it from the legacy copies (hero first, then the footer/global badge).
 */
export function normalizeAvailability(doc: Doc): AvailabilityContent {
  const a = doc?.availability;
  if (a && typeof a === "object" && AVAILABILITY_STATES.includes(a.state)) {
    return {
      state: a.state,
      label: str(a.label, 60) || DEFAULT_AVAILABILITY.label,
      note: str(a.note, 100),
    };
  }
  const tone = String(doc?.home?.heroStatusColor || doc?.global?.footerAvailabilityColor || doc?.global?.availabilityStatusColor || "green").toLowerCase();
  return {
    state: TONE_TO_STATE[tone] ?? "available",
    label: str(doc?.home?.heroStatus, 60) || str(doc?.global?.availabilityStatus, 60) || DEFAULT_AVAILABILITY.label,
    note:
      str(doc?.global?.footerAvailabilityBadge, 100) ||
      str(doc?.global?.availabilityBadge, 100) ||
      str(doc?.home?.heroBadge, 100) ||
      DEFAULT_AVAILABILITY.note,
  };
}

/* ------------------------------------------------------------------ per-page SEO */

export type SeoPageKey = "home" | "about" | "projects" | "blog" | "uses" | "resume" | "contact" | "ai";
export interface SeoEntry {
  title: string;
  description: string;
}
export const SEO_PAGES: { key: SeoPageKey; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "about", label: "About", path: "/about" },
  { key: "projects", label: "Projects", path: "/projects" },
  { key: "blog", label: "Journal", path: "/blog" },
  { key: "uses", label: "Uses", path: "/uses" },
  { key: "resume", label: "Resume", path: "/resume" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "ai", label: "Orbit", path: "/ai" },
];
/** Empty title/description = use the page's built-in wording (see SEO_FALLBACKS). */
export type SeoContent = Record<SeoPageKey, SeoEntry>;

/** The wording each page shipped with, used whenever an override is left empty. */
export const SEO_FALLBACKS: SeoContent = {
  home: { title: "", description: "" }, // home falls back to the site title and short bio
  about: {
    title: "About | Rushan Siddiqui : Full Stack Developer",
    description:
      "Learn about Rushan Siddiqui's background, evolution from static web pages to modern engineering systems, and core development principles.",
  },
  projects: {
    title: "Featured Projects | RAWIN 3.0",
    description: "Selected web applications, tools, and experiments built by Rushan Siddiqui.",
  },
  blog: {
    title: "The Dev Log | Rushan Siddiqui",
    description: "Exploring the intersection of software architecture, intelligent agents, and performant web systems.",
  },
  uses: {
    title: "What I Use | Rushan Siddiqui",
    description: "The tools, software, engineering stack, and personal workflow used daily by Rushan Siddiqui.",
  },
  resume: {
    title: "Resume & Curriculum Vitae | Rushan Siddiqui",
    description: "Professional resume and developer profile of Rushan Siddiqui: Full Stack Developer.",
  },
  contact: {
    title: "Contact & Inquiries | Rushan Siddiqui : Full Stack Developer",
    description:
      "Direct communication channel for Rushan Siddiqui : Full Stack Developer. Open to full-time developer roles, freelance contracts, and software architecture consultancies.",
  },
  ai: {
    title: "RAWIN ORBIT | AI Intelligence Interface",
    description:
      "RAWIN ORBIT is the AI system built by Rushan Siddiqui for exploring projects, engineering background, writing, and platform architecture.",
  },
};
export const SEO_LIMITS = { title: 70, description: 200 } as const;

export function normalizeSeo(raw: unknown): SeoContent {
  const src = raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
  const out = {} as SeoContent;
  for (const { key } of SEO_PAGES) {
    out[key] = { title: str(src[key]?.title, SEO_LIMITS.title), description: str(src[key]?.description, SEO_LIMITS.description) };
  }
  return out;
}

/** The title/description a page should publish: the override, else its shipped wording. */
export function seoFor(seo: SeoContent | undefined, key: SeoPageKey, fallback?: Partial<SeoEntry>): SeoEntry {
  const own = seo?.[key];
  return {
    title: own?.title || fallback?.title || SEO_FALLBACKS[key].title,
    description: own?.description || fallback?.description || SEO_FALLBACKS[key].description,
  };
}

/* ------------------------------------------------------------------ homepage lists */

export type CapabilityLevel = "Advanced" | "Proficient" | "Specialized";
export const CAPABILITY_LEVELS: CapabilityLevel[] = ["Advanced", "Proficient", "Specialized"];
export interface CapabilityItem {
  name: string;
  level: CapabilityLevel;
  description: string;
  highlight?: boolean;
}
export interface CapabilityGroup {
  title: string;
  badge: string;
  description: string;
  items: CapabilityItem[];
}
export interface ValueItem {
  title: string;
  tagline: string;
  description: string;
}
export interface JourneyItem {
  period: string;
  role: string;
  context: string;
  description: string;
  highlights: string[];
}

export const DEFAULT_CAPABILITIES: CapabilityGroup[] = TECH_ARSENAL.map((g) => ({
  title: g.title,
  badge: g.badge,
  description: g.description,
  items: g.items.map((i) => ({ name: i.name, level: i.level, description: i.description, highlight: Boolean(i.highlight) })),
}));
export const DEFAULT_VALUES: ValueItem[] = VALUE_PROPOSITIONS.map((v) => ({ title: v.title, tagline: v.tagline, description: v.description }));
export const DEFAULT_JOURNEY: JourneyItem[] = TIMELINE.map((t) => ({
  period: t.period,
  role: t.role,
  context: t.companyOrContext,
  description: t.description,
  highlights: [...t.highlights],
}));

const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export function normalizeCapabilities(raw: unknown): CapabilityGroup[] {
  const groups = list(raw)
    .map((g) => ({
      title: str(g?.title, 60),
      badge: str(g?.badge, 40),
      description: str(g?.description, 300),
      items: list(g?.items)
        .map((i) => ({
          name: str(i?.name, 60),
          level: (CAPABILITY_LEVELS.includes(i?.level) ? i.level : "Proficient") as CapabilityLevel,
          description: str(i?.description, 200),
          highlight: Boolean(i?.highlight),
        }))
        .filter((i) => i.name),
    }))
    .filter((g) => g.title);
  return groups.length ? groups : DEFAULT_CAPABILITIES;
}

export function normalizeValues(raw: unknown): ValueItem[] {
  const items = list(raw)
    .map((v) => ({ title: str(v?.title, 60), tagline: str(v?.tagline, 100), description: str(v?.description, 400) }))
    .filter((v) => v.title);
  return items.length ? items : DEFAULT_VALUES;
}

export function normalizeJourney(raw: unknown): JourneyItem[] {
  const items = list(raw)
    .map((j) => ({
      period: str(j?.period, 40),
      role: str(j?.role, 100),
      context: str(j?.context, 100),
      description: str(j?.description, 500),
      highlights: list(j?.highlights).map((h) => str(h, 200)).filter(Boolean),
    }))
    .filter((j) => j.role && j.period);
  return items.length ? items : DEFAULT_JOURNEY;
}

/** Shapes the existing homepage/About components render (kept so their markup is unchanged). */
export function journeyForDisplay(items: JourneyItem[]) {
  return items.map((j) => ({ period: j.period, role: j.role, companyOrContext: j.context, description: j.description, highlights: j.highlights }));
}
export function valuesForDisplay(items: ValueItem[]) {
  return items.map((v, i) => ({ ...v, metric: String(i + 1).padStart(2, "0") }));
}

/* ------------------------------------------------------------------ validation (admin input) */

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };
const DASH = /[—–]/;

function parseJson(raw: string, fallback: string): unknown {
  return JSON.parse(raw || fallback);
}

export function parseAvailabilityField(key: "state" | "label" | "note", raw: string): FieldResult<string> {
  const v = raw.trim();
  if (key === "state") {
    return AVAILABILITY_STATES.includes(v as AvailabilityState) ? { ok: true, value: v } : { ok: false, error: "Choose an availability state." };
  }
  const max = key === "label" ? 60 : 100;
  if (key === "label" && !v) return { ok: false, error: "The status label cannot be empty." };
  if (v.length > max) return { ok: false, error: `Keep this under ${max} characters.` };
  if (DASH.test(v)) return { ok: false, error: "Use hyphens or middle dots (·) instead of em dashes." };
  return { ok: true, value: v };
}

export function parseSeoField(raw: string): FieldResult<SeoEntry> {
  let parsed: any;
  try {
    parsed = parseJson(raw, "{}");
  } catch {
    return { ok: false, error: "Invalid SEO entry." };
  }
  const title = typeof parsed?.title === "string" ? parsed.title.trim() : "";
  const description = typeof parsed?.description === "string" ? parsed.description.trim() : "";
  if (title.length > SEO_LIMITS.title) return { ok: false, error: `SEO titles should stay under ${SEO_LIMITS.title} characters.` };
  if (description.length > SEO_LIMITS.description) return { ok: false, error: `SEO descriptions should stay under ${SEO_LIMITS.description} characters.` };
  if (DASH.test(title) || DASH.test(description)) return { ok: false, error: "Use hyphens or middle dots (·) instead of em dashes." };
  return { ok: true, value: { title, description } };
}

function itemsOf(raw: string, what: string, max: number): FieldResult<any[]> {
  let parsed: unknown;
  try {
    parsed = parseJson(raw, "[]");
  } catch {
    return { ok: false, error: `Invalid ${what} list.` };
  }
  if (!Array.isArray(parsed)) return { ok: false, error: `${what} must be a list.` };
  if (parsed.length > max) return { ok: false, error: `Keep ${what.toLowerCase()} to ${max} entries or fewer.` };
  if (DASH.test(JSON.stringify(parsed))) return { ok: false, error: "Use hyphens or middle dots (·) instead of em dashes." };
  return { ok: true, value: parsed };
}

export function parseCapabilitiesField(raw: string): FieldResult<CapabilityGroup[]> {
  const r = itemsOf(raw, "Capability groups", 8);
  if (!r.ok) return r;
  const groups: CapabilityGroup[] = [];
  for (let i = 0; i < r.value.length; i++) {
    const g = r.value[i] ?? {};
    const title = str(g.title, 200);
    if (!title) return { ok: false, error: `Capability group ${i + 1} needs a title.` };
    if (title.length > 60) return { ok: false, error: `“${title.slice(0, 20)}…” is longer than 60 characters.` };
    const items = list(g.items);
    if (items.length > 12) return { ok: false, error: `“${title}” can hold up to 12 skills.` };
    const cleaned: CapabilityItem[] = [];
    for (const it of items) {
      const name = str(it?.name, 200);
      if (!name) continue;
      if (name.length > 60) return { ok: false, error: `Skill “${name.slice(0, 20)}…” is longer than 60 characters.` };
      cleaned.push({
        name,
        level: CAPABILITY_LEVELS.includes(it?.level) ? it.level : "Proficient",
        description: str(it?.description, 200),
        highlight: Boolean(it?.highlight),
      });
    }
    groups.push({ title, badge: str(g.badge, 40), description: str(g.description, 300), items: cleaned });
  }
  if (!groups.length) return { ok: false, error: "Keep at least one capability group." };
  return { ok: true, value: groups };
}

export function parseValuesField(raw: string): FieldResult<ValueItem[]> {
  const r = itemsOf(raw, "Values", 8);
  if (!r.ok) return r;
  const out: ValueItem[] = [];
  for (let i = 0; i < r.value.length; i++) {
    const v = r.value[i] ?? {};
    const title = str(v.title, 200);
    if (!title) return { ok: false, error: `Value ${i + 1} needs a title.` };
    if (title.length > 60) return { ok: false, error: `“${title.slice(0, 20)}…” is longer than 60 characters.` };
    out.push({ title, tagline: str(v.tagline, 100), description: str(v.description, 400) });
  }
  if (!out.length) return { ok: false, error: "Keep at least one value." };
  return { ok: true, value: out };
}

export function parseJourneyField(raw: string): FieldResult<JourneyItem[]> {
  const r = itemsOf(raw, "Journey entries", 12);
  if (!r.ok) return r;
  const out: JourneyItem[] = [];
  for (let i = 0; i < r.value.length; i++) {
    const j = r.value[i] ?? {};
    const period = str(j.period, 40);
    const role = str(j.role, 200);
    if (!period) return { ok: false, error: `Journey entry ${i + 1} needs a period (e.g. 2024 - Present).` };
    if (!role) return { ok: false, error: `Journey entry ${i + 1} needs a role.` };
    if (role.length > 100) return { ok: false, error: `“${role.slice(0, 20)}…” is longer than 100 characters.` };
    const highlights = list(j.highlights).map((h) => str(h, 200)).filter(Boolean);
    if (highlights.length > 6) return { ok: false, error: `“${role}” can list up to 6 highlights.` };
    out.push({ period, role, context: str(j.context, 100), description: str(j.description, 500), highlights });
  }
  if (!out.length) return { ok: false, error: "Keep at least one journey entry." };
  return { ok: true, value: out };
}

/* ------------------------------------------------------------------ closing scene */

export const DEFAULT_CLOSING = {
  closingInvite: "Let's make something *impossible* to ignore.",
  closingPrompt: "Start a conversation",
  closingCta: "Start a project",
};

/* ------------------------------------------------------------------ shared helper */

/**
 * Separate a ledger description from a trailing year ("UPDATED REGULARLY · 2026" →
 * { description: "UPDATED REGULARLY", year: "2026" }). Values without one pass through.
 */
export function splitLedgerDescription(value?: string | null): { description: string; year: string } {
  const text = (value || "").trim();
  const m = text.match(/^(.*?)\s*[·•|,-]?\s*(\d{4})$/);
  if (!m) return { description: text, year: "" };
  return { description: m[1].trim().replace(/[\s·•|,-]+$/, ""), year: m[2] };
}

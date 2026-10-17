/**
 * RAWIN's startup rules, in one place and free of framework code (tests, the Studio and the
 * pre-paint boot script all use these):
 *
 *   - Supernova: the CMS launch event (site content `launchExperience`). Its effective status
 *     (disabled / armed / active / expired / error) is DERIVED from the saved settings and the
 *     current time; nothing stores a status, so a window expires on time with nobody watching.
 *   - Signal Awakening: the short, normal first-visit startup, once per browser session.
 *   - decideStartup(): the one decision per page load (Supernova first, else Signal Awakening,
 *     never both). Its source text is inlined in the boot script, so the public site, the
 *     Studio's diagnostics and the tests run exactly the same rule.
 *
 * Time policy: instants are UTC epoch milliseconds everywhere. The Studio edits them as
 * Asia/Kolkata wall time (IST, UTC+05:30, no daylight saving; lib/dateUtils.ts) and stores ISO
 * UTC strings. Older date-only values ("2026-09-21") are read as the start (00:00) or the end
 * (24:00) of that day in IST. A visitor's own time zone never matters: only the instant does.
 */

export const SUPERNOVA_DURATIONS = [10, 12, 15] as const;
export type SupernovaDuration = (typeof SUPERNOVA_DURATIONS)[number];
export const SUPERNOVA_DEFAULT_DURATION: SupernovaDuration = 12;
export const SUPERNOVA_DEFAULT_TITLE = "RAWIN v3.0";
export const SUPERNOVA_TITLE_MAX = 60;
export const SUPERNOVA_SUBTITLE_MAX = 120;

export type LaunchStatus = "disabled" | "armed" | "active" | "expired" | "error";

/** The saved settings this module reads (site-content `launchExperience`). */
export interface LaunchSettings {
  enabled: boolean;
  primaryMessage: string;
  secondaryMessage?: string;
  duration: number;
  startDate?: string | null;
  endDate?: string | null;
  launchVersion: string;
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * An instant from a saved schedule value: null when not set, NaN when it cannot be read.
 * ISO strings with a zone (Z or +hh:mm) are taken as written; a date-only legacy value is the
 * start or the end of that day in IST.
 */
export function parseLaunchInstant(value: string | null | undefined, edge: "start" | "end"): number | null {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (!v) return null;
  const day = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (day) {
    const [y, m, d] = [Number(day[1]), Number(day[2]), Number(day[3])];
    const utcMidnight = Date.UTC(y, m - 1, d);
    const check = new Date(utcMidnight);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return NaN;
    const startOfDayIst = utcMidnight - IST_OFFSET_MS;
    return edge === "start" ? startOfDayIst : startOfDayIst + 24 * 60 * 60 * 1000;
  }
  // a full instant must say which zone it is in: no guessing from the reader's own clock
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(v)) return NaN;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : NaN;
}

/** The preset a saved duration plays as (older free values snap to the nearest preset). */
export function supernovaDuration(raw: unknown): SupernovaDuration {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return SUPERNOVA_DEFAULT_DURATION;
  let best: SupernovaDuration = SUPERNOVA_DEFAULT_DURATION;
  for (const d of SUPERNOVA_DURATIONS) if (Math.abs(d - n) < Math.abs(best - n)) best = d;
  return best;
}

export interface LaunchState {
  status: LaunchStatus;
  /** why it is not active (for the Studio's diagnostics), or null when active */
  reason: string | null;
  valid: boolean;
  problems: string[];
  enabled: boolean;
  startMs: number | null;
  endMs: number | null;
  duration: SupernovaDuration;
  title: string;
  eventId: string;
}

/** Problems that make a configuration unusable (empty when it is valid). */
export function launchProblems(s: LaunchSettings): string[] {
  const out: string[] = [];
  const title = (s.primaryMessage ?? "").trim();
  if (!title) out.push("The launch title is empty.");
  if (title.length > SUPERNOVA_TITLE_MAX) out.push(`The launch title is longer than ${SUPERNOVA_TITLE_MAX} characters.`);
  if (!/^[A-Za-z0-9._-]{1,50}$/.test(s.launchVersion ?? "")) out.push("The launch event id is missing or malformed.");
  const start = parseLaunchInstant(s.startDate, "start");
  const end = parseLaunchInstant(s.endDate, "end");
  if (Number.isNaN(start)) out.push("The start time cannot be read.");
  if (Number.isNaN(end)) out.push("The end time cannot be read.");
  if (typeof start === "number" && typeof end === "number" && !Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
    out.push("The end time is not after the start time.");
  }
  return out;
}

/** The effective status of the launch at `now` (epoch ms), with everything the Studio shows. */
export function launchState(s: LaunchSettings | null | undefined, now: number): LaunchState {
  const base = {
    enabled: Boolean(s?.enabled),
    duration: supernovaDuration(s?.duration),
    title: (s?.primaryMessage ?? "").trim() || SUPERNOVA_DEFAULT_TITLE,
    eventId: s?.launchVersion ?? "",
  };
  if (!s) return { ...base, status: "error", reason: "No launch settings could be read.", valid: false, problems: ["No launch settings could be read."], startMs: null, endMs: null };
  const problems = launchProblems(s);
  const startRaw = parseLaunchInstant(s.startDate, "start");
  const endRaw = parseLaunchInstant(s.endDate, "end");
  const startMs = typeof startRaw === "number" && !Number.isNaN(startRaw) ? startRaw : null;
  const endMs = typeof endRaw === "number" && !Number.isNaN(endRaw) ? endRaw : null;
  const valid = problems.length === 0;
  if (!s.enabled) return { ...base, status: "disabled", reason: "Supernova is switched off.", valid, problems, startMs, endMs };
  if (!valid) return { ...base, status: "error", reason: problems[0], valid, problems, startMs, endMs };
  if (startMs !== null && now < startMs) return { ...base, status: "armed", reason: "The launch window has not started yet.", valid, problems, startMs, endMs };
  if (endMs !== null && now >= endMs) return { ...base, status: "expired", reason: "The launch window has ended.", valid, problems, startMs, endMs };
  return { ...base, status: "active", reason: null, valid, problems, startMs, endMs };
}

/* ------------------------------------------------------------------ the startup decision */

/** What the boot script knows about the launch (embedded by the server at render time). */
export interface BootLaunch {
  enabled: boolean;
  valid: boolean;
  startMs: number | null;
  endMs: number | null;
  eventId: string;
}

export interface StartupInput {
  path: string;
  now: number;
  launch: BootLaunch | null;
  /** launch event ids this browser has completed */
  done: string[];
  /** Signal Awakening completed in this browser session */
  sessionDone: boolean;
  /**
   * The HTTP status this page was served with, where the browser reports it (Navigation Timing
   * responseStatus); 0 or absent when unknown. An error status means a system screen.
   */
  status?: number;
}

export type StartupChoice = "supernova" | "awakening" | "none";

/**
 * The one startup decision for a page load. Self-contained (no imports, no closures): its
 * source is inlined in the pre-paint boot script.
 *   1. no startup on the Studio, the maintenance screen or Orbit's conversation page, nor on a
 *      page served with an error status (not found, server error, maintenance: system screens
 *      show at once and leave both startups owed);
 *   2. Supernova when the launch is on, valid, inside its window and not yet completed here;
 *   3. else Signal Awakening, once per browser session;
 *   4. else straight to the site. Never both.
 * Reduced motion does not change the choice, only how it plays (startupPlan).
 */
export function decideStartup(i: StartupInput): StartupChoice {
  if (/^\/(saint-denis|maintenance|ai)(\/|$)/.test(i.path)) return "none";
  if (typeof i.status === "number" && i.status >= 400) return "none";
  const l = i.launch;
  if (
    l &&
    l.enabled &&
    l.valid &&
    typeof l.eventId === "string" &&
    l.eventId.length > 0 &&
    (l.startMs === null || i.now >= l.startMs) &&
    (l.endMs === null || i.now < l.endMs) &&
    i.done.indexOf(l.eventId) < 0
  ) {
    return "supernova";
  }
  if (i.sessionDone) return "none";
  return "awakening";
}

/**
 * How long a startup runs and when the site behind it is revealed (ms), per layout and motion
 * preference. Self-contained (inlined in the boot script, so the reveal fractions are literals
 * here; they equal the "reveal" stage starts below, which the tests check). The special launch
 * scales with its preset; the normal startup lasts about 2.5 s; reduced motion gets a short,
 * calm fade with no light pulse.
 */
export function startupPlan(choice: string, durationS: number, mobile: boolean, reduced: boolean): { totalMs: number; revealMs: number } {
  if (choice === "supernova") {
    if (reduced) return { totalMs: 3200, revealMs: 2400 };
    const d = durationS === 10 || durationS === 15 ? durationS : 12;
    return { totalMs: d * 1000, revealMs: Math.round(d * 1000 * 0.9) };
  }
  if (choice === "awakening") {
    if (reduced) return { totalMs: 900, revealMs: 520 };
    const total = mobile ? 2400 : 2600;
    return { totalMs: total, revealMs: Math.round(total * 0.86) };
  }
  return { totalMs: 0, revealMs: 0 };
}

/** The launch as the boot script sees it (derived on the server from the saved settings). */
export function bootLaunch(s: LaunchSettings | null | undefined): BootLaunch | null {
  if (!s) return null;
  const st = launchState(s, 0);
  return { enabled: st.enabled, valid: st.valid, startMs: st.startMs, endMs: st.endMs, eventId: st.eventId };
}

/* ------------------------------------------------------------------ timelines */

/**
 * Future System stages as fractions of the run, so every preset keeps the same choreography
 * (10 s, 12 s and 15 s all end exactly on time). The special launch (internally "supernova", the
 * CMS name) is the deeper sequence; the normal startup ("awakening") is the short one of the same
 * family. Each has exactly one activation pulse.
 */
export const SUPERNOVA_STAGES = [
  { id: "dormant", from: 0, to: 0.08 },
  { id: "structure", from: 0.08, to: 0.28 },
  { id: "synchronization", from: 0.28, to: 0.52 },
  { id: "alignment", from: 0.52, to: 0.66 },
  { id: "activation", from: 0.66, to: 0.74 },
  { id: "identity", from: 0.74, to: 0.9 },
  { id: "reveal", from: 0.9, to: 1 },
] as const;
export const AWAKENING_STAGES = [
  { id: "dormant", from: 0, to: 0.12 },
  { id: "initialization", from: 0.12, to: 0.42 },
  { id: "synchronization", from: 0.42, to: 0.6 },
  { id: "activation", from: 0.6, to: 0.7 },
  { id: "identity", from: 0.7, to: 0.86 },
  { id: "reveal", from: 0.86, to: 1 },
] as const;
export type SupernovaStage = (typeof SUPERNOVA_STAGES)[number]["id"];

export interface TimelineStage {
  id: SupernovaStage;
  startMs: number;
  endMs: number;
}

/** The stages in milliseconds for a duration (seconds): contiguous, ending at the duration. */
export function supernovaTimeline(durationS: number): TimelineStage[] {
  const total = supernovaDuration(durationS) * 1000;
  return SUPERNOVA_STAGES.map((s) => ({ id: s.id, startMs: Math.round(s.from * total), endMs: Math.round(s.to * total) }));
}

/** The stage at elapsed time t (ms) of a timeline. */
export function stageAt(timeline: TimelineStage[], t: number): SupernovaStage {
  for (const s of timeline) if (t < s.endMs) return s.id;
  return "reveal";
}

/* ------------------------------------------------------------------ CMS input */

export interface LaunchInput {
  enabled?: unknown;
  primaryMessage?: unknown;
  secondaryMessage?: unknown;
  duration?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  launchVersion?: unknown;
}

export type LaunchInputResult =
  | { ok: true; value: { enabled: boolean; primaryMessage: string; secondaryMessage: string; duration: SupernovaDuration; startDate: string | null; endDate: string | null; launchVersion: string } }
  | { ok: false; error: string; field: string };

/**
 * Server-side validation of the Studio's launch settings: the title is required and short,
 * the duration is one of the presets, schedule values are complete instants with a zone (the
 * Studio converts IST input before sending), the end follows the start, and the event id is a
 * plain token. Nothing is silently replaced: a bad value is an error with its field.
 */
export function validateLaunchInput(d: LaunchInput): LaunchInputResult {
  const title = typeof d.primaryMessage === "string" ? d.primaryMessage.trim() : "";
  if (!title) return { ok: false, error: "Give the launch a title.", field: "primaryMessage" };
  if (title.length > SUPERNOVA_TITLE_MAX) return { ok: false, error: `The title can be at most ${SUPERNOVA_TITLE_MAX} characters.`, field: "primaryMessage" };
  const subtitle = typeof d.secondaryMessage === "string" ? d.secondaryMessage.trim() : "";
  if (subtitle.length > SUPERNOVA_SUBTITLE_MAX) return { ok: false, error: `The line under the title can be at most ${SUPERNOVA_SUBTITLE_MAX} characters.`, field: "secondaryMessage" };
  const duration = Number(d.duration);
  if (!SUPERNOVA_DURATIONS.includes(duration as SupernovaDuration)) return { ok: false, error: "Choose a length of 10, 12 or 15 seconds.", field: "duration" };
  const norm = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const startDate = norm(d.startDate);
  const endDate = norm(d.endDate);
  const start = parseLaunchInstant(startDate, "start");
  const end = parseLaunchInstant(endDate, "end");
  if (Number.isNaN(start)) return { ok: false, error: "The start time could not be read.", field: "startDate" };
  if (Number.isNaN(end)) return { ok: false, error: "The end time could not be read.", field: "endDate" };
  if (start !== null && end !== null && end <= start) return { ok: false, error: "The end time must be after the start time.", field: "endDate" };
  const launchVersion = typeof d.launchVersion === "string" ? d.launchVersion.trim() : "";
  if (!/^[A-Za-z0-9._-]{1,50}$/.test(launchVersion)) return { ok: false, error: "The launch event id may use letters, digits, dot, dash and underscore (up to 50).", field: "launchVersion" };
  return { ok: true, value: { enabled: d.enabled === true, primaryMessage: title, secondaryMessage: subtitle, duration: duration as SupernovaDuration, startDate, endDate, launchVersion } };
}

/** A fresh event id for a new launch: readable, sortable, unique to the minute in IST. */
export function newLaunchEventId(now: number): string {
  const ist = new Date(now + IST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `launch-${ist.getUTCFullYear()}${p(ist.getUTCMonth() + 1)}${p(ist.getUTCDate())}-${p(ist.getUTCHours())}${p(ist.getUTCMinutes())}`;
}

/* ------------------------------------------------------------------ browser records */

/** Completed launch events (this browser): written only when a Supernova finishes. */
export const SUPERNOVA_DONE_KEY = "rawin-supernova-done";
/** Signal Awakening completed (this browser session). */
export const AWAKENING_DONE_KEY = "rawin-awakening-done";

export function readDoneEvents(storage: Pick<Storage, "getItem"> | null): string[] {
  try {
    const raw = storage?.getItem(SUPERNOVA_DONE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function recordDoneEvent(storage: Pick<Storage, "getItem" | "setItem"> | null, eventId: string) {
  try {
    const list = readDoneEvents(storage).filter((x) => x !== eventId);
    list.push(eventId);
    storage?.setItem(SUPERNOVA_DONE_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    // storage unavailable: the launch may show again on a later visit, never wrongly hidden
  }
}

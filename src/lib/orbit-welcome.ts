/**
 * Orbit's welcome line, part two: after the time-of-day greeting (lib/orbit-greeting) comes one
 * short message drawn at random from a CMS-editable collection (ai.welcomeMessages). The two
 * are independent: the clock picks the greeting, each visit picks the message.
 *
 * Every message has to read naturally on its own line (phones) and straight after
 * "Good morning." on one line (desktop), at any hour, so none of them mention a time of day.
 */

/** The library a fresh install starts with (used while the CMS has never saved its own). */
export const DEFAULT_WELCOME_MESSAGES: readonly string[] = [
  "Where would you like to begin?",
  "What's worth figuring out?",
  "Let's untangle something.",
  "Bring the half-formed idea. We'll shape it.",
  "What would you like to make sense of?",
  "Let's turn a rough idea into something real.",
  "Maybe there's a better way to look at it.",
  "What's the question behind the question?",
  "Start anywhere. We'll find the thread.",
  "What are you building?",
  "Think out loud. I'll keep up.",
  "Which problem deserves a fresh angle?",
  "Let's explore an idea you haven't tried yet.",
  "What's been nagging at you?",
  "Something to decide? Let's weigh it.",
  "What would make this simpler?",
  "Pick a thread and pull.",
  "Curious about something? Start there.",
  "Let's map out the unknowns.",
  "What's the smallest useful next step?",
  "Got a messy problem? Good.",
  "What deserves a second look?",
  "Let's find the interesting part.",
  "What would you try if it were easy?",
  "Ask the question you've been saving.",
  "Let's sketch it before we build it.",
  "Which idea won't leave you alone?",
  "Start with what you already know.",
  "Let's make the complicated part clear.",
  "What are we exploring?",
  "Bring a question, leave with a plan.",
  "What would the better version look like?",
  "Let's test an assumption or two.",
  "What's the hardest part? Start there.",
  "There's usually a simpler way. Let's look.",
  "What needs a clearer answer?",
  "Let's work it out, one piece at a time.",
  "What's worth learning next?",
  "Every good build starts with a question.",
  "Tell me what you're weighing.",
];

/** Used only when a saved collection holds nothing usable (empty or blank entries). */
export const FALLBACK_WELCOME_MESSAGES: readonly string[] = [
  "Where would you like to begin?",
  "What's worth figuring out?",
  "Let's untangle something.",
];

export const WELCOME_LIMITS = { maxMessages: 60, maxLength: 70 } as const;

/** Trimmed, de-duplicated, non-blank strings; anything else is dropped. */
export function cleanWelcomeMessages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const text = item.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push(text);
  }
  return out;
}

/**
 * The collection a stored document yields: never saved → the default library; saved but
 * holding nothing usable → the small fallback set.
 */
export function welcomeMessagesFrom(stored: unknown): string[] {
  if (stored === undefined || stored === null) return [...DEFAULT_WELCOME_MESSAGES];
  const cleaned = cleanWelcomeMessages(stored);
  return cleaned.length ? cleaned : [...FALLBACK_WELCOME_MESSAGES];
}

/** Validates the admin editor's submission (a JSON array of strings). */
export function parseWelcomeMessagesInput(json: string): { ok: true; messages: string[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json || "[]");
  } catch {
    return { ok: false, error: "Invalid welcome messages." };
  }
  if (!Array.isArray(parsed)) return { ok: false, error: "Welcome messages must be a list." };
  const messages = cleanWelcomeMessages(parsed);
  if (!messages.length) return { ok: false, error: "Add at least one welcome message." };
  if (messages.length > WELCOME_LIMITS.maxMessages) {
    return { ok: false, error: `Keep the welcome messages to ${WELCOME_LIMITS.maxMessages} or fewer.` };
  }
  const long = messages.find((m) => m.length > WELCOME_LIMITS.maxLength);
  if (long) {
    return { ok: false, error: `“${long.slice(0, 24)}…” is longer than ${WELCOME_LIMITS.maxLength} characters.` };
  }
  if (messages.some((m) => /[—–]/.test(m))) {
    return { ok: false, error: "Welcome messages cannot contain em dashes. Please use hyphens or full stops instead." };
  }
  return { ok: true, messages };
}

/**
 * One message for a new visit. Avoids repeating `previous` (the last one this browser tab
 * showed) whenever there is any other choice.
 */
export function pickWelcome(messages: readonly string[], previous: string | null, random: () => number = Math.random): string {
  const pool = messages.length ? messages : FALLBACK_WELCOME_MESSAGES;
  const fresh = pool.length > 1 && previous ? pool.filter((m) => m !== previous) : pool;
  const from = fresh.length ? fresh : pool;
  return from[Math.min(from.length - 1, Math.floor(random() * from.length))];
}

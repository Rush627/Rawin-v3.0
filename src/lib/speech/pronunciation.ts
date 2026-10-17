/**
 * How Orbit's voices should say abbreviations: one dictionary for the whole speech pipeline,
 * applied only to the text that is spoken (the visible reply, its history and copies are never
 * changed). Two voices read Orbit's replies, and each needs its own spelling:
 *
 * DEVICE (the browser's Web Speech voices). Checked on this machine's Microsoft voices through
 * the phonemes the engine reports (Hazel, the voices Chrome and Edge use on Windows):
 *   - "A.I.", "L.L.M." (letters with dots) are read as letter names; so are plain "LLM", "NPU";
 *   - a dotted form with anything attached is read with "dot" ("G.P.U.s" -> "gee dot pee dot..."),
 *     and "AI's" / "Ai" become "eyes" / "eye". So: dotted on its own, the plain plural ("LLMs",
 *     read "el el emz"), spaced letters before a possessive ("A I's"), and a hyphen becomes a
 *     space ("A.I. powered"). Apple's and Google's voices were not available to check.
 *
 * CLOUD (MeloTTS). Its English front end looks each word up in a CMU dictionary (checked in the
 * model's published cmudict.rep), so every letter is written as a word whose entry is that
 * letter's name: AY = "ay" (a lone "A" is the article "uh"), I = "eye", EL, EM, EN, PEE, YOU...
 * F and H have no dictionary word, so "EF" and "AITCH" are left to its spelling-based guesser.
 *
 * Abbreviations people say as words (RAM, JSON, REST...) are left alone, as are ordinary
 * capitalised words: only the dictionary below is spelled out.
 */

export type SpeechVoiceKind = "device" | "cloud";

/** Spelled letter by letter. Checked against the abbreviations RAWIN's content and Orbit use. */
export const INITIALISMS = [
  // AI and hardware
  "AI", "ML", "DL", "LLM", "NLP", "GPT", "GPU", "CPU", "TPU", "NPU", "SSD", "HDD", "PC", "USB", "LED", "LCD", "AR", "VR",
  // web and software
  "API", "SDK", "CLI", "IDE", "UI", "UX", "OS", "VM", "URL", "HTTP", "HTTPS", "HTML", "CSS", "JS", "TS", "SQL", "XML", "SVG", "PNG",
  "PDF", "CSV", "JWT", "CMS", "SEO", "PWA", "SSE", "SSR", "CI", "CD", "QA", "PR", "UUID", "RSS",
  // networks and infrastructure
  "DNS", "SSH", "TLS", "SSL", "CDN", "IP", "TCP", "UDP", "VPN", "AWS", "GCP", "MCP",
  // speech and documents
  "TTS", "STT", "ASR", "OCR",
  // units and data
  "ID", "DB", "KB", "MB", "GB", "TB", "FPS", "UTC", "TTL", "SMS",
] as const;

/** Mixed- or lower-case forms that are unambiguously these abbreviations. */
export const CASE_FORMS: Record<string, string> = { IoT: "IOT", npm: "NPM", Ai: "AI", ai: "AI" };

/** Said as words: never spelled out (listed so the choice is explicit and tested). */
export const SPOKEN_AS_WORDS = [
  "RAM", "ROM", "RAG", "JSON", "REST", "CORS", "CRUD", "NASA", "SaaS", "GUI", "YAML", "WASM", "JPEG", "HEIC", "HEIF",
  "MIME", "GIF", "LAN", "WAN", "OLED", "PIN", "SIM", "RAWIN",
] as const;

const SPELLED = new Set<string>(INITIALISMS);

/** MeloTTS spellings: each letter as a dictionary word read as that letter's name. */
const CLOUD_LETTER: Record<string, string> = {
  A: "AY", B: "BEE", C: "SEE", D: "DEE", E: "E", F: "EF", G: "GEE", H: "AITCH", I: "I", J: "JAY", K: "KAY", L: "EL", M: "EM",
  N: "EN", O: "OH", P: "PEE", Q: "CUE", R: "ARE", S: "ESS", T: "TEE", U: "YOU", V: "VEE", W: "DOUBLE YOU", X: "EX", Y: "WHY", Z: "ZEE",
};
/** The plural letter names that are dictionary words (others take a final Z for the guesser). */
const CLOUD_PLURAL: Record<string, string> = {
  B: "BEES", C: "SEES", D: "DEES", G: "GEES", I: "EYES", J: "JAYS", K: "KAYS", L: "ELS", O: "OHS", Q: "CUES", R: "ARES",
  T: "TEES", V: "VEES", Y: "WHYS", X: "EXES", S: "ESSES",
};

/** "A.I.." -> "A.I.": one period after a dotted abbreviation that ends a sentence. */
export function collapseLetterDots(text: string): string {
  return text.replace(/([A-Z]\.)\.(?!\.)/g, "$1");
}

/** A dot that does not end a sentence (kept through sentence splitting in voice-engine). */
export const LETTER_DOT = "․";

function spell(letters: string, voice: SpeechVoiceKind, form: "bare" | "plural" | "possessive" | "hyphen", dot: string): string {
  const chars = letters.split("");
  if (voice === "cloud") {
    const words = chars.map((c) => CLOUD_LETTER[c] ?? c);
    if (form === "plural" || form === "possessive") {
      const last = chars[chars.length - 1];
      words[words.length - 1] = CLOUD_PLURAL[last] ?? `${CLOUD_LETTER[last] ?? last}Z`;
    }
    return words.join(" ") + (form === "hyphen" ? " " : "");
  }
  if (form === "plural") return `${letters}s`;
  if (form === "possessive") return `${chars.join(" ")}'s`;
  return chars.map((c) => c + dot).join("") + (form === "hyphen" ? " " : "");
}

const TOKEN = /(^|[^\w@./\\#:'’-])([A-Z]{2,5}|IoT|npm|Ai|ai)(?:(['’]s)|(s))?(?:(-)(?=[A-Za-z])|(?=$|[^\w@/\\]))/g;
const SHOUTED = /^[A-Z]{2,}$/;

/**
 * Spoken spelling of the dictionary's abbreviations, for one voice. `dot` is the character used
 * between device letters ("." by default; LETTER_DOT inside the pipeline so sentence splitting
 * does not cut an abbreviation). Safe to apply twice: its output contains no abbreviation that
 * matches again.
 */
export function speakInitialisms(text: string, voice: SpeechVoiceKind, dot = "."): string {
  // pairs written with a slash: "UI/UX" is said "UI and UX", "CI/CD" runs together
  let t = text.replace(/\b([A-Z]{2,5})\/([A-Z]{2,5})\b/g, (m, a: string, b: string) =>
    SPELLED.has(a) && SPELLED.has(b) ? (a === "CI" && b === "CD" ? "CI CD" : `${a} and ${b}`) : m,
  );
  // a capitalised name ending in AI (OpenAI, GenAI): the name, then the letters
  t = t.replace(/\b([A-Z][a-z]+)AI\b/g, "$1 AI");
  // an "A.I." already in the text: MeloTTS would read its "A" as the article
  if (voice === "cloud") t = t.replace(/\bA\.I\.(?=\s|$|[,;:!?)])/g, "AI");
  t = t.replace(TOKEN, (m, lead: string, word: string, poss: string | undefined, plural: string | undefined, hyphen: string | undefined, offset: number, all: string) => {
    const letters = CASE_FORMS[word] ?? (SPELLED.has(word) ? word : null);
    if (!letters) return m;
    if (word === "Ai" && !poss && !plural && /^\s+[A-Z][a-z]/.test(all.slice(offset + m.length))) return m; // a name ("Ai Weiwei")
    // a shouted all-caps phrase ("NOT ON THE UI") is left to the voice: not an abbreviation context
    const before = all.slice(0, offset + lead.length).match(/([A-Za-z]+)\W*$/)?.[1] ?? "";
    const after = all.slice(offset + m.length).match(/^\W*([A-Za-z]+)/)?.[1] ?? "";
    const shouted = [before, after].filter((w) => SHOUTED.test(w) && !SPELLED.has(w) && !CASE_FORMS[w]).length > 0;
    if (shouted && SHOUTED.test(word)) return m;
    const form = poss ? "possessive" : plural ? "plural" : hyphen ? "hyphen" : "bare";
    return lead + spell(letters, voice, form, dot);
  });
  // "...powered by AI." must not end in "A.I.." (device). Inside the pipeline (LETTER_DOT) the
  // sentence's own period is kept, so the sentence split still sees it; it is merged afterwards.
  if (voice === "device" && dot === ".") t = collapseLetterDots(t);
  // brand words written in capitals that voices would spell
  t = t.replace(/\bRAWIN\b/g, "Rawin");
  return t;
}

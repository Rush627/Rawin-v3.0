/**
 * Project tones give each project its own visual identity inside the shared system.
 * Stored optionally on the project document (`tone`). When absent, a stable tone is
 * derived from the slug so older projects still get distinct, consistent treatments.
 */
export const PROJECT_TONES = ["violet", "mint", "ember", "indigo", "pearl"] as const;
export type ProjectTone = (typeof PROJECT_TONES)[number];

export const TONE_LABELS: Record<ProjectTone, string> = {
  violet: "Violet",
  mint: "Mineral",
  ember: "Clay",
  indigo: "Deep Ink",
  pearl: "Paper",
};

/** Gradient stops used for placeholders, washes and accents. Keys stay stable for stored documents. */
export const TONE_SWATCH: Record<ProjectTone, { a: string; b: string; c: string; ink: string }> = {
  violet: { a: "#33287f", b: "#7a70cc", c: "#dedaf3", ink: "#ffffff" },
  mint: { a: "#26324a", b: "#62789c", c: "#d6dde9", ink: "#ffffff" },
  ember: { a: "#54281a", b: "#ac684b", c: "#efdfd3", ink: "#ffffff" },
  indigo: { a: "#0e0d1d", b: "#2a2852", c: "#8a86bf", ink: "#ffffff" },
  pearl: { a: "#cdc8be", b: "#e8e4dc", c: "#fffdf9", ink: "#141318" },
};

export function isProjectTone(value: unknown): value is ProjectTone {
  return typeof value === "string" && (PROJECT_TONES as readonly string[]).includes(value);
}

export function resolveTone(project: { tone?: string | null; slug?: string; title?: string }): ProjectTone {
  if (isProjectTone(project.tone)) return project.tone;
  const key = project.slug || project.title || "rawin";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PROJECT_TONES[hash % PROJECT_TONES.length];
}

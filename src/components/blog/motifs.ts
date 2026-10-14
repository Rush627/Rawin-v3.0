/**
 * Editorial illustration motifs for blog articles. Pure data, shared by the public renderer,
 * the admin editor and tests.
 *
 * An article's motif comes from its own CMS fields: an explicit `illustration` choice wins;
 * when it is absent ("auto") the motif is derived from the article's title, category and tags, so
 * every article gets a relevant diagram without per-slug code, and editors can override or
 * turn it off ("none") in the article editor.
 */

export const MOTIFS = ["render-timeline", "interaction-loop", "system-map", "signal-field"] as const;
export type Motif = (typeof MOTIFS)[number];
export type IllustrationSetting = Motif | "auto" | "none";

export const MOTIF_LABEL: Record<Motif, string> = {
  "render-timeline": "Rendering timeline",
  "interaction-loop": "Interaction loop",
  "system-map": "System map",
  "signal-field": "Signal field",
};

/** What each diagram shows (used as its accessible description when no caption is set). */
export const MOTIF_DESCRIPTION: Record<Motif, string> = {
  "render-timeline":
    "Diagram: a page load measured as a timeline, with the moments a metric records above and the way the wait feels to a person below.",
  "interaction-loop": "Diagram: an interaction loop in which an action produces feedback, which settles into a new state that invites the next action.",
  "system-map": "Diagram: a system map of independent modules connected through a shared core, each able to grow on its own.",
  "signal-field": "Diagram: an abstract field of signal paths and connected nodes.",
};

const RULES: { motif: Motif; words: RegExp }[] = [
  { motif: "render-timeline", words: /\b(performance|speed|fast|rendering|loading|latency|core web vitals|lcp|ttfb)\b/i },
  { motif: "interaction-loop", words: /\b(interaction|interface|ui\/?ux|ux|ui|motion|feedback|usability|craft)\b/i },
  { motif: "system-map", words: /\b(architecture|system|systems|scal\w*|cms|structure|modular|next\.?js|react|frontend|backend)\b/i },
];

export function isIllustrationSetting(v: unknown): v is IllustrationSetting {
  return v === "auto" || v === "none" || (typeof v === "string" && (MOTIFS as readonly string[]).includes(v));
}

/**
 * The motif to draw for an article, or null when illustrations are turned off. The title is
 * weighed first, then the category, then tags in order, so the article's primary subject decides.
 */
export function resolveMotif(post: { illustration?: string; title?: string; category?: string; tags?: string[] }): Motif | null {
  const setting = isIllustrationSetting(post.illustration) ? post.illustration : "auto";
  if (setting === "none") return null;
  if (setting !== "auto") return setting;
  const subjects = [post.title, post.category, ...(post.tags || [])].filter(Boolean) as string[];
  for (const subject of subjects) {
    const rule = RULES.find((r) => r.words.test(subject));
    if (rule) return rule.motif;
  }
  return "signal-field";
}

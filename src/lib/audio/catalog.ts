/**
 * The site's two recordings, each served in three encodings (see public/audio/CREDITS.md):
 * Ogg Opus (smallest), AAC in MP4 and MP3 (universal fallback). The browser downloads only the
 * first one it can play; a later one only if decoding the first fails. Nothing is synthesised:
 * a missing file means silence.
 */

export interface AudioFormat {
  ext: string;
  /** what canPlayType is asked (the codec, not just the container) */
  type: string;
}

/** Smallest first; MP3 last, as the fallback every browser decodes. */
export const FORMATS: AudioFormat[] = [
  { ext: "opus", type: 'audio/ogg; codecs="opus"' },
  { ext: "m4a", type: 'audio/mp4; codecs="mp4a.40.2"' },
  { ext: "mp3", type: "audio/mpeg" },
];

/** The interface click: one per activation; a new click cuts the previous one's tail. */
export const CLICK = { base: "/audio/clicking-sound", gain: 0.42, cooldownMs: 70, chokeS: 0.04 } as const;

/**
 * The site ambience, decoded once and looped seamlessly in memory (lib/audio/loop.ts): the loop
 * runs over the recording's steady body, from 12 s to 119 s, with a 6 s splice.
 *
 * Two levels: `heroLevel` while the homepage hero fills the view, `ambientLevel` everywhere else
 * (below the hero and on every other public page); the level glides between them (`glideS`
 * time constant) and drops out quickly (`duckS`) while Orbit listens or speaks.
 */
export const AMBIENCE = {
  base: "/audio/background-sound",
  heroLevel: 0.32,
  ambientLevel: 0.1,
  glideS: 0.45,
  duckS: 0.12,
  fadeInS: 3,
  loop: { start: 12, end: 119, xfade: 6 },
} as const;

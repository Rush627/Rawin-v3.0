/** Dependency-free validation for Orbit voice recordings (shared by the route and tests). */

export const TRANSCRIBE_LIMITS = {
  maxBytes: 3 * 1024 * 1024, // ~3 MB ≈ well over the 30 s client cap at Opus bitrates
  minBytes: 1024,
  timeoutMs: 25_000,
} as const;

export type AudioKind = "webm" | "ogg" | "mp4" | "wav";

/** Identify the container from its leading bytes; anything else is rejected. */
export function detectAudio(bytes: Uint8Array): AudioKind | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "webm";
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "ogg";
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "mp4";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
  )
    return "wav";
  return null;
}

export type TranscribeResult = { ok: true; text: string } | { ok: false; error: string; status: number };

export function validateAudio(bytes: Uint8Array): TranscribeResult | null {
  if (bytes.length < TRANSCRIBE_LIMITS.minBytes) return { ok: false, error: "The recording was too short.", status: 400 };
  if (bytes.length > TRANSCRIBE_LIMITS.maxBytes) return { ok: false, error: "The recording is too long.", status: 413 };
  if (!detectAudio(bytes)) return { ok: false, error: "Unsupported audio format.", status: 415 };
  return null;
}


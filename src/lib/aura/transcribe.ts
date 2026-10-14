/**
 * Orbit voice fallback: transcribe a short browser recording with Workers AI Whisper —
 * the same Cloudflare account Orbit already uses for chat. Audio is validated by size and
 * container signature, sent once, and never stored or logged.
 */
import { getAuraConfig } from "./config";
import { TRANSCRIBE_LIMITS, validateAudio, type TranscribeResult } from "./audio-validate";

export { TRANSCRIBE_LIMITS, detectAudio, validateAudio } from "./audio-validate";
export type { TranscribeResult } from "./audio-validate";

const WHISPER_MODEL = "@cf/openai/whisper";

export async function transcribeAudio(bytes: Uint8Array): Promise<TranscribeResult> {
  const invalid = validateAudio(bytes);
  if (invalid) return invalid;

  const config = getAuraConfig();
  if (!config.accountId || !config.apiToken) {
    return { ok: false, error: "Transcription is not configured.", status: 503 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSCRIBE_LIMITS.timeoutMs);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${WHISPER_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiToken}`, "Content-Type": "application/octet-stream" },
      body: bytes as unknown as BodyInit,
      signal: controller.signal,
    });
    if (res.status === 429) return { ok: false, error: "Transcription is busy. Try again in a moment.", status: 429 };
    if (!res.ok) return { ok: false, error: "Transcription failed. Try again or type your message.", status: 502 };
    const data = (await res.json().catch(() => null)) as { result?: { text?: string } } | null;
    const text = (data?.result?.text || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    return { ok: true, text };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return { ok: false, error: aborted ? "Transcription timed out." : "Transcription failed.", status: aborted ? 504 : 502 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Orbit spoken replies: text to speech with Workers AI MeloTTS on the same Cloudflare account
 * Orbit already uses for chat (free daily allocation; no other provider, no paid fallback).
 * Dependency-free so the route and the tests share it; nothing is stored, and neither the
 * text nor the audio is logged.
 *
 * Contract, as observed from the REST API (the model page describes MP3 output, but the REST
 * response is JSON): { result: { audio: "<base64>" }, success: true }, where the audio is a
 * RIFF/WAVE file (16-bit PCM, mono, 44.1 kHz). Binary audio/* responses are accepted too, and
 * the bytes are checked by signature (WAV or MP3) rather than trusted.
 */

export const MELOTTS_MODEL = "@cf/myshell-ai/melotts";

export const SPEECH_LIMITS = {
  /** One request is one or a few sentences; the client splits longer replies */
  maxChars: 600,
  timeoutMs: 20_000,
  /** Per client, per minute (a long reply is several requests) */
  perMinute: 40,
} as const;

export type SpeechErrorCode = "not-configured" | "quota" | "busy" | "timeout" | "upstream" | "malformed" | "bad-request";

export type SpeechResult =
  | { ok: true; audio: Uint8Array; contentType: "audio/wav" | "audio/mpeg" }
  | { ok: false; status: number; code: SpeechErrorCode; error: string };

export const SPEECH_ERROR_TEXT: Record<SpeechErrorCode, string> = {
  "not-configured": "Orbit's voice isn't configured on this server.",
  quota: "Orbit's voice has used today's free Cloudflare allowance. It resets at 00:00 UTC.",
  busy: "Orbit's voice is busy. Try again in a moment.",
  timeout: "Orbit's voice took too long to respond. Try again.",
  upstream: "Orbit's voice couldn't generate this reply. Try again.",
  malformed: "Orbit's voice returned audio that couldn't be played. Try again.",
  "bad-request": "There is nothing to read aloud.",
};

const fail = (status: number, code: SpeechErrorCode): SpeechResult => ({ ok: false, status, code, error: SPEECH_ERROR_TEXT[code] });

/** Plain text only, control characters removed, whitespace collapsed */
export function cleanSpeechText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type AudioKind = "wav" | "mp3";

export function detectSpeechAudio(b: Uint8Array): AudioKind | null {
  if (b.length >= 44 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45) return "wav";
  if (b.length >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return "mp3"; // ID3 tag
  if (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return "mp3"; // frame sync
  return null;
}

interface WavInfo {
  format: number;
  channels: number;
  rate: number;
  bits: number;
  dataOffset: number;
  dataLength: number;
}

export function readWav(b: Uint8Array): WavInfo | null {
  if (detectSpeechAudio(b) !== "wav") return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let fmt: Omit<WavInfo, "dataOffset" | "dataLength"> | null = null;
  let o = 12;
  while (o + 8 <= b.length) {
    const id = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
    const len = v.getUint32(o + 4, true);
    if (id === "fmt " && o + 24 <= b.length) {
      fmt = { format: v.getUint16(o + 8, true), channels: v.getUint16(o + 10, true), rate: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    } else if (id === "data") {
      if (!fmt) return null;
      const dataLength = Math.min(len, b.length - (o + 8));
      return { ...fmt, dataOffset: o + 8, dataLength };
    }
    o += 8 + len + (len % 2);
  }
  return null;
}

function wavHeader(rate: number, dataLength: number): Uint8Array {
  const h = new Uint8Array(44);
  const v = new DataView(h.buffer);
  const ascii = (o: number, s: string) => [...s].forEach((c, i) => (h[o + i] = c.charCodeAt(0)));
  ascii(0, "RIFF");
  v.setUint32(4, 36 + dataLength, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii(36, "data");
  v.setUint32(40, dataLength, true);
  return h;
}

/**
 * Halve 44.1/48 kHz 16-bit mono PCM (pairs averaged): speech loses nothing audible and the
 * download is half the size, which matters on a phone. Anything else is returned unchanged.
 */
export function compactWav(b: Uint8Array): Uint8Array {
  const info = readWav(b);
  if (!info || info.format !== 1 || info.channels !== 1 || info.bits !== 16 || info.rate < 44100) return b;
  const samples = Math.floor(info.dataLength / 2);
  const outSamples = Math.floor(samples / 2);
  const src = new DataView(b.buffer, b.byteOffset + info.dataOffset, samples * 2);
  const out = new Uint8Array(44 + outSamples * 2);
  out.set(wavHeader(Math.round(info.rate / 2), outSamples * 2), 0);
  const dst = new DataView(out.buffer, 44);
  for (let i = 0; i < outSamples; i++) {
    const a = src.getInt16(i * 4, true);
    const c = src.getInt16(i * 4 + 2, true);
    dst.setInt16(i * 2, Math.round((a + c) / 2), true);
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

/** Workers AI reports an exhausted daily free allocation with error 4006 ("daily free allocation") */
export function isQuotaError(status: number, body: string): boolean {
  return /\b4006\b|daily free allocation|neurons/i.test(body) || (status === 429 && /allocation|quota|limit exceeded for the day/i.test(body));
}

export interface SynthesizeOptions {
  accountId: string;
  apiToken: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function synthesizeSpeech(rawText: unknown, opts: SynthesizeOptions): Promise<SpeechResult> {
  const text = cleanSpeechText(rawText);
  if (!text) return fail(400, "bad-request");
  if (text.length > SPEECH_LIMITS.maxChars) return { ok: false, status: 413, code: "bad-request", error: "This passage is too long to read in one request." };
  if (!opts.accountId || !opts.apiToken) return fail(503, "not-configured");

  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? SPEECH_LIMITS.timeoutMs);
  try {
    const res = await doFetch(`https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/${MELOTTS_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, lang: "en" }),
      signal: controller.signal,
    });
    const type = res.headers.get("content-type") || "";
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (isQuotaError(res.status, body)) return fail(429, "quota");
      if (res.status === 429) return fail(429, "busy");
      if (res.status === 408 || res.status === 504) return fail(504, "timeout");
      return fail(502, "upstream");
    }

    let audio: Uint8Array;
    if (type.startsWith("audio/")) {
      audio = new Uint8Array(await res.arrayBuffer());
    } else {
      const data = (await res.json().catch(() => null)) as { result?: { audio?: unknown }; success?: boolean; errors?: unknown } | null;
      if (data && data.success === false) {
        return isQuotaError(200, JSON.stringify(data.errors ?? "")) ? fail(429, "quota") : fail(502, "upstream");
      }
      const b64 = data?.result?.audio;
      if (typeof b64 !== "string" || !b64) return fail(502, "malformed");
      audio = base64ToBytes(b64);
    }

    const kind = detectSpeechAudio(audio);
    if (kind === "wav") {
      const info = readWav(audio);
      if (!info || info.dataLength < 64) return fail(502, "malformed");
      return { ok: true, audio: compactWav(audio), contentType: "audio/wav" };
    }
    if (kind === "mp3" && audio.length > 256) return { ok: true, audio, contentType: "audio/mpeg" };
    return fail(502, "malformed");
  } catch (err) {
    return err instanceof Error && err.name === "AbortError" ? fail(504, "timeout") : fail(502, "upstream");
  } finally {
    clearTimeout(timer);
  }
}

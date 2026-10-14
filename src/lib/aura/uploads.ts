import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { Binary, type Collection } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getSecretKey } from "@/lib/auth-token";
import { getAuraConfig } from "./config";
import { FORMAT_RULES, UPLOAD_LIMITS, extensionOf, sanitizeFileName, type UploadFamily } from "./upload-policy";
import { sniff, type ReadyAttachment } from "./attachment-text";

export { withExtractedAttachments, type ReadyAttachment } from "./attachment-text";

/**
 * Orbit attachment uploads — server side.
 *
 * A file travels in raw binary chunks (UPLOAD_LIMITS.chunkBytes each, so every request stays
 * under serverless body limits) into a temporary MongoDB collection, is reassembled once
 * complete, checked against its real content (magic bytes, not the extension), then turned
 * into text: UTF-8 decoding for text formats, Cloudflare Workers AI `toMarkdown` for the rest.
 * Only that text is kept, next to the upload record, and only the chat request that presents
 * the upload's signed token can use it.
 *
 * Nothing here ever serves file bytes back to anyone. Parts are deleted as soon as the file is
 * processed; records (and any parts of abandoned uploads) expire through TTL indexes after
 * UPLOAD_LIMITS.ttlMinutes. File contents are never logged.
 */

export type UploadStatus = "uploading" | "processing" | "ready" | "failed";

interface UploadDoc {
  _id: string;
  name: string;
  ext: string;
  family: UploadFamily;
  size: number;
  parts: number;
  status: UploadStatus;
  /** characters of extracted text kept (after the storage cap) and whether that cap applied */
  chars?: number;
  truncated?: boolean;
  error?: string;
  /** when processing began (a run cut off by a function timeout may be retried later) */
  processingAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

/** Extracted text, gzip-compressed and stored in segments (MongoDB caps a document at 16 MB). */
interface TextDoc {
  uploadId: string;
  index: number;
  data: Binary;
  expiresAt: Date;
}

interface PartDoc {
  uploadId: string;
  index: number;
  data: Binary;
  expiresAt: Date;
}

/** Extracted text kept per file (the model only ever sees an excerpt of it). A text file of
 *  50 MB decodes to at most ~52 M characters, so this cap only guards against conversions
 *  that balloon. */
const MAX_STORED_CHARS = 60_000_000;
/** Bytes of compressed text per stored segment. */
const TEXT_SEGMENT_BYTES = 12 * 1024 * 1024;
/** Conversion request timeout (large PDFs take a while). */
const CONVERT_TIMEOUT_MS = 120_000;

let indexesReady: Promise<void> | null = null;

async function collections(): Promise<{ uploads: Collection<UploadDoc>; parts: Collection<PartDoc>; texts: Collection<TextDoc> } | null> {
  const db = await getDatabase();
  if (!db) return null;
  const uploads = db.collection<UploadDoc>("orbit_uploads");
  const parts = db.collection<PartDoc>("orbit_upload_parts");
  const texts = db.collection<TextDoc>("orbit_upload_text");
  indexesReady ??= Promise.all([
    uploads.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    parts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    parts.createIndex({ uploadId: 1, index: 1 }, { unique: true }),
    texts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    texts.createIndex({ uploadId: 1, index: 1 }, { unique: true }),
  ])
    .then(() => undefined)
    .catch((err) => {
      indexesReady = null;
      throw err;
    });
  await indexesReady;
  return { uploads, parts, texts };
}

// ------------------------------------------------------------------ ownership tokens
function sign(id: string): string {
  return createHmac("sha256", Buffer.from(getSecretKey())).update(`orbit-upload:${id}`).digest("base64url");
}

export function verifyUploadToken(id: unknown, token: unknown): id is string {
  if (typeof id !== "string" || typeof token !== "string" || !/^[a-f0-9]{32}$/.test(id)) return false;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export class UploadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const unavailable = () => new UploadError("File uploads are temporarily unavailable.", 503);

// ------------------------------------------------------------------ 1. start
export async function startUpload(rawName: unknown, rawSize: unknown) {
  const name = sanitizeFileName(typeof rawName === "string" ? rawName : "");
  const size = typeof rawSize === "number" && Number.isInteger(rawSize) ? rawSize : -1;
  const ext = extensionOf(name);
  const rule = FORMAT_RULES[ext];
  if (!rule) throw new UploadError(`“${name}” isn't a supported file type.`, 415);
  if (size <= 0) throw new UploadError(`“${name}” is empty.`, 400);
  if (size > UPLOAD_LIMITS.maxFileBytes) throw new UploadError(`“${name}” is larger than 50 MB.`, 413);
  if (rule.kind === "convert" && size > UPLOAD_LIMITS.convertMaxBytes) {
    throw new UploadError(`“${name}” is larger than 28 MB, the document converter's limit. Text files can be up to 50 MB.`, 413);
  }

  const c = await collections();
  if (!c) throw unavailable();
  const id = randomBytes(16).toString("hex");
  const now = new Date();
  const parts = Math.ceil(size / UPLOAD_LIMITS.chunkBytes);
  await c.uploads.insertOne({
    _id: id,
    name,
    ext,
    family: rule.family,
    size,
    parts,
    status: "uploading",
    createdAt: now,
    expiresAt: new Date(now.getTime() + UPLOAD_LIMITS.ttlMinutes * 60_000),
  });
  return { id, token: sign(id), chunkBytes: UPLOAD_LIMITS.chunkBytes, parts };
}

// ------------------------------------------------------------------ 2. chunks
export async function putChunk(id: string, index: number, body: ArrayBuffer) {
  const c = await collections();
  if (!c) throw unavailable();
  const doc = await c.uploads.findOne({ _id: id }, { projection: { text: 0 } });
  if (!doc) throw new UploadError("This upload has expired. Attach the file again.", 404);
  if (doc.status !== "uploading") throw new UploadError("This upload is already complete.", 409);
  if (!Number.isInteger(index) || index < 0 || index >= doc.parts) throw new UploadError("Invalid chunk index.", 400);
  const last = index === doc.parts - 1;
  const expected = last ? doc.size - index * UPLOAD_LIMITS.chunkBytes : UPLOAD_LIMITS.chunkBytes;
  if (body.byteLength !== expected) throw new UploadError("Chunk size mismatch.", 400);
  // idempotent: a retried chunk replaces itself
  await c.parts.updateOne(
    { uploadId: id, index },
    { $set: { data: new Binary(Buffer.from(body)), expiresAt: doc.expiresAt } },
    { upsert: true },
  );
}

// ------------------------------------------------------------------ 3. complete + process
async function convert(buf: Buffer, name: string, mime: string): Promise<string> {
  const config = getAuraConfig();
  if (!config.accountId || !config.apiToken) throw new UploadError("Document conversion isn't configured on this server.", 503);
  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(buf)], { type: mime }), name);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONVERT_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/tomarkdown`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiToken}` },
      body: form,
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      result?: { format?: string; data?: string; error?: string }[];
    } | null;
    const item = json?.result?.[0];
    if (!res.ok || !json?.success || !item) {
      throw new UploadError(res.status === 413 ? "The converter rejected this file as too large." : "The file couldn't be converted. Try again, or attach a different format.", 502);
    }
    if (item.format !== "markdown" || typeof item.data !== "string") {
      throw new UploadError("The file couldn't be read (it may be damaged, encrypted or password-protected).", 422);
    }
    return item.data;
  } catch (err) {
    if (err instanceof UploadError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new UploadError("Reading this file took too long. Try a smaller file.", 504);
    throw new UploadError("The file couldn't be converted. Try again in a moment.", 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Normalise line endings and collapse long runs of blank lines. */
function tidy(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

export async function completeUpload(id: string) {
  const c = await collections();
  if (!c) throw unavailable();
  const doc = await c.uploads.findOne({ _id: id }, { projection: { text: 0 } });
  if (!doc) throw new UploadError("This upload has expired. Attach the file again.", 404);
  if (doc.status === "ready" || doc.status === "failed") return summary(doc);
  if (doc.status === "processing" && doc.processingAt && Date.now() - doc.processingAt.getTime() < 150_000) {
    throw new UploadError("This file is already being processed.", 409);
  }

  const parts = await c.parts.find({ uploadId: id }).sort({ index: 1 }).toArray();
  if (parts.length !== doc.parts || parts.some((p, i) => p.index !== i)) throw new UploadError("The upload is incomplete. Try again.", 409);
  const buf = Buffer.concat(parts.map((p) => Buffer.from(p.data.buffer)));
  if (buf.length !== doc.size) throw new UploadError("The upload is incomplete. Try again.", 409);

  await c.uploads.updateOne({ _id: id }, { $set: { status: "processing", processingAt: new Date() } });
  let text = "";
  let error: string | undefined;
  try {
    const problem = sniff(buf, doc.ext);
    if (problem) throw new UploadError(problem.startsWith("This is") ? problem : `“${doc.name}” ${problem}`, 415);
    const rule = FORMAT_RULES[doc.ext];
    text = rule.kind === "text" ? new TextDecoder("utf-8").decode(buf) : tidy(await convert(buf, doc.name, rule.mime));
    if (text.replace(/\s+/g, "").length < 12) {
      throw new UploadError(
        doc.family === "pdf"
          ? `No readable text was found in “${doc.name}”. Scanned PDFs need OCR, which isn't available here.`
          : `No readable content was found in “${doc.name}”.`,
        422,
      );
    }
  } catch (err) {
    error = err instanceof UploadError ? err.message : "The file couldn't be processed.";
  } finally {
    // the bytes are never needed again
    await c.parts.deleteMany({ uploadId: id }).catch(() => undefined);
  }

  const truncated = text.length > MAX_STORED_CHARS;
  const kept = truncated ? text.slice(0, MAX_STORED_CHARS) : text;
  if (!error) {
    const packed = gzipSync(Buffer.from(kept, "utf8"), { level: 6 });
    const segments: TextDoc[] = [];
    for (let i = 0; i * TEXT_SEGMENT_BYTES < packed.length; i++) {
      segments.push({ uploadId: id, index: i, data: new Binary(packed.subarray(i * TEXT_SEGMENT_BYTES, (i + 1) * TEXT_SEGMENT_BYTES)), expiresAt: doc.expiresAt });
    }
    await c.texts.deleteMany({ uploadId: id });
    await c.texts.insertMany(segments);
  }
  const update: Partial<UploadDoc> = error ? { status: "failed", error } : { status: "ready", chars: kept.length, truncated };
  await c.uploads.updateOne({ _id: id }, { $set: update });
  return summary({ ...doc, ...update });
}

function summary(doc: Pick<UploadDoc, "status" | "chars" | "truncated" | "error" | "family">) {
  return { status: doc.status, chars: doc.chars ?? 0, truncated: Boolean(doc.truncated), error: doc.error, family: doc.family };
}

export async function discardUpload(id: string) {
  const c = await collections();
  if (!c) return;
  await Promise.all([c.uploads.deleteOne({ _id: id }), c.parts.deleteMany({ uploadId: id }), c.texts.deleteMany({ uploadId: id })]);
}

// ------------------------------------------------------------------ 4. use in a chat turn
/** Load the extracted text of uploads the caller holds tokens for; only ready uploads count. */
export async function loadReadyAttachments(refs: { id: string; token: string }[]): Promise<ReadyAttachment[]> {
  const c = await collections();
  if (!c) throw unavailable();
  const out: ReadyAttachment[] = [];
  for (const ref of refs) {
    const doc = await c.uploads.findOne({ _id: ref.id });
    if (!doc) throw new UploadError("An attachment has expired. Attach the file again.", 410);
    if (doc.status !== "ready") throw new UploadError(`“${doc.name}” isn't ready yet.`, 409);
    const segments = await c.texts.find({ uploadId: ref.id }).sort({ index: 1 }).toArray();
    if (!segments.length) throw new UploadError("An attachment has expired. Attach the file again.", 410);
    const text = gunzipSync(Buffer.concat(segments.map((t) => Buffer.from(t.data.buffer)))).toString("utf8");
    out.push({ name: doc.name, family: doc.family, text, truncated: Boolean(doc.truncated) });
  }
  return out;
}


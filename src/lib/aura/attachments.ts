/**
 * Orbit attachments in a chat request — validated entirely on the server.
 *
 * Files are uploaded and converted to text beforehand (see ./uploads and /api/ai/uploads); a
 * chat request only names them by id together with the signed token issued when each upload
 * started, so a request can use its own uploads and nobody else's. The extracted text is
 * inlined into the single user turn it arrived with (see withExtractedAttachments).
 */
import { UPLOAD_LIMITS } from "./upload-policy";
import { verifyUploadToken } from "./uploads";

export interface AttachmentRef {
  id: string;
  token: string;
}

export type AttachmentResult = { ok: true; refs: AttachmentRef[] } | { ok: false; error: string; status: number };

export function validateAttachments(raw: unknown): AttachmentResult {
  if (raw === undefined || raw === null) return { ok: true, refs: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "Attachments must be a list.", status: 400 };
  if (raw.length > UPLOAD_LIMITS.maxFiles) {
    return { ok: false, error: `Attach up to ${UPLOAD_LIMITS.maxFiles} files per message.`, status: 400 };
  }
  const refs: AttachmentRef[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") return { ok: false, error: "Malformed attachment.", status: 400 };
    const { id, token } = item as Record<string, unknown>;
    if (!verifyUploadToken(id, token)) return { ok: false, error: "An attachment could not be verified. Attach the file again.", status: 403 };
    if (seen.has(id)) continue;
    seen.add(id);
    refs.push({ id, token: token as string });
  }
  return { ok: true, refs };
}

import { revalidatePath } from "next/cache";
import { storeResumePdfFile } from "./site-content";
import { invalidateCacheTag } from "./cache";

export const RESUME_PDF_MAX_BYTES = 10 * 1024 * 1024;

/**
 * The single resume-upload path, used by the admin server action and by
 * POST /api/resume/upload. Validates by content (%PDF- header), not by the declared type,
 * then stores through storeResumePdfFile (new file, then reference, then old file removed).
 * Callers are responsible for the admin session check.
 */
export async function storeUploadedResume(
  file: unknown
): Promise<{ fileId: string; filename: string; url: string; size: number } | { error: string; status: number }> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF to upload.", status: 400 };
  }
  if (file.size > RESUME_PDF_MAX_BYTES) {
    return { error: "The resume PDF must be 10 MB or smaller.", status: 400 };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return { error: "That file is not a PDF (its contents were checked, not its name).", status: 400 };
  }
  try {
    const result = await storeResumePdfFile(buffer, file.name || "resume.pdf", file.size);
    try {
      invalidateCacheTag("site-content");
    } catch {}
    try {
      revalidatePath("/", "layout");
    } catch {}
    return result;
  } catch (err: unknown) {
    console.error("[Resume PDF] Upload failed:", err instanceof Error ? err.message : String(err));
    return { error: "The resume could not be stored. The previous PDF is still published.", status: 500 };
  }
}

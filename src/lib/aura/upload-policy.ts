/**
 * Orbit attachment policy — shared by the browser (preflight) and the server (enforcement).
 *
 * Every format listed here is one the pipeline can actually read:
 *   "text"     decoded as UTF-8 on the server (plain text, Markdown, data and source files)
 *   "convert"  converted to Markdown by Cloudflare Workers AI `toMarkdown` (PDF, images, Office,
 *              OpenDocument, CSV, HTML, XML, Numbers). Images are turned into a written
 *              description by Workers AI vision models: Orbit reads that description, not pixels.
 *
 * Not listed, with a reason the UI can give: HEIC/HEIF (no decoder in the pipeline; iOS
 * converts photos chosen from the Photo Library to JPEG automatically), PPTX/PPT/DOC (no
 * converter available), archives and executables.
 *
 * Sizes are binary megabytes: 50 MB = 50 × 1024 × 1024 bytes. Text formats are read on the
 * server and can use the full 50 MB. Formats that go through Cloudflare's converter are capped
 * at 28 MB: its toMarkdown endpoint was verified to convert a 28 MB PDF and to fail on 36 MB
 * (error 6006), and Cloudflare publishes no limit, so the cap is the largest size known to work.
 */

export const MB = 1024 * 1024;

export const UPLOAD_LIMITS = {
  /** per file */
  maxFileBytes: 50 * MB,
  /** per file, for formats converted by Cloudflare toMarkdown (PDF, images, Office, …) */
  convertMaxBytes: 28 * MB,
  /** files per message */
  maxFiles: 3,
  /** all files of one message together */
  maxTotalBytes: 100 * MB,
  /** raw bytes per upload request: stays under serverless body limits (~6 MB) with headroom */
  chunkBytes: 3 * MB,
  maxNameLength: 120,
  /** how long an upload (and its extracted text) is kept before automatic deletion */
  ttlMinutes: 60,
} as const;

export type UploadKind = "text" | "convert";
export type UploadFamily = "image" | "pdf" | "document" | "spreadsheet" | "text" | "code" | "web";

interface FormatRule {
  kind: UploadKind;
  family: UploadFamily;
  /** canonical MIME sent to the converter */
  mime: string;
}

const T = (family: UploadFamily, mime = "text/plain"): FormatRule => ({ kind: "text", family, mime });
const C = (family: UploadFamily, mime: string): FormatRule => ({ kind: "convert", family, mime });

export const FORMAT_RULES: Record<string, FormatRule> = {
  // images (described by Workers AI)
  jpg: C("image", "image/jpeg"),
  jpeg: C("image", "image/jpeg"),
  png: C("image", "image/png"),
  webp: C("image", "image/webp"),
  gif: C("image", "image/gif"),
  bmp: C("image", "image/bmp"),
  svg: C("image", "image/svg+xml"),
  // documents
  pdf: C("pdf", "application/pdf"),
  docx: C("document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  odt: C("document", "application/vnd.oasis.opendocument.text"),
  xlsx: C("spreadsheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  xlsm: C("spreadsheet", "application/vnd.ms-excel.sheet.macroenabled.12"),
  xlsb: C("spreadsheet", "application/vnd.ms-excel.sheet.binary.macroenabled.12"),
  xls: C("spreadsheet", "application/vnd.ms-excel"),
  ods: C("spreadsheet", "application/vnd.oasis.opendocument.spreadsheet"),
  numbers: C("spreadsheet", "application/vnd.apple.numbers"),
  csv: C("spreadsheet", "text/csv"),
  html: C("web", "text/html"),
  htm: C("web", "text/html"),
  xml: C("web", "application/xml"),
  // plain text and source
  txt: T("text"),
  md: T("text"),
  markdown: T("text"),
  log: T("text"),
  tsv: T("text"),
  json: T("code"),
  yml: T("code"),
  yaml: T("code"),
  toml: T("code"),
  ini: T("code"),
  js: T("code"),
  jsx: T("code"),
  ts: T("code"),
  tsx: T("code"),
  mjs: T("code"),
  cjs: T("code"),
  py: T("code"),
  rb: T("code"),
  go: T("code"),
  rs: T("code"),
  java: T("code"),
  kt: T("code"),
  swift: T("code"),
  c: T("code"),
  h: T("code"),
  cpp: T("code"),
  hpp: T("code"),
  cs: T("code"),
  php: T("code"),
  sql: T("code"),
  css: T("code"),
  scss: T("code"),
  sh: T("code"),
};

/** Formats people commonly try that the pipeline cannot read, with what to do instead. */
const UNSUPPORTED_HINTS: Record<string, string> = {
  heic: "HEIC photos can't be read here. Choose the photo from your Photo Library (it's sent as JPEG) or export it as JPEG.",
  heif: "HEIF photos can't be read here. Choose the photo from your Photo Library (it's sent as JPEG) or export it as JPEG.",
  pptx: "Presentations can't be read yet. Export the slides as PDF and attach that.",
  ppt: "Presentations can't be read yet. Export the slides as PDF and attach that.",
  key: "Presentations can't be read yet. Export the slides as PDF and attach that.",
  doc: "Legacy .doc files can't be read. Save the document as .docx or PDF.",
  rtf: "RTF can't be read. Save the document as .docx, PDF or plain text.",
  pages: "Pages documents can't be read. Export as PDF or .docx.",
};

/**
 * The file input's `accept`. `image/*` lets iOS offer the Photo Library (and convert HEIC
 * photos to JPEG); extensions keep Files / document pickers on everything else.
 */
export const ACCEPT_ATTRIBUTE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", ...Object.keys(FORMAT_RULES).map((e) => `.${e}`)].join(",");

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** A file name safe to show and store: no path, no control or markup characters. */
export function sanitizeFileName(name: string): string {
  const base = String(name).split(/[\\/]/).pop() || "";
  const clean = base.replace(/[^\p{L}\p{N}._\- ()]/gu, "").replace(/^\.+/, "").trim();
  return clean.slice(-UPLOAD_LIMITS.maxNameLength) || "file";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / MB).toFixed(n < 10 * MB ? 1 : 0)} MB`;
}

export type PreflightResult = { ok: true; ext: string; rule: FormatRule } | { ok: false; error: string };

/** Type and size checks that need no file contents (the server repeats them and sniffs bytes). */
export function preflight(name: string, size: number): PreflightResult {
  const ext = extensionOf(name);
  const rule = FORMAT_RULES[ext];
  const label = sanitizeFileName(name);
  if (!rule) {
    return { ok: false, error: UNSUPPORTED_HINTS[ext] ? `“${label}”: ${UNSUPPORTED_HINTS[ext]}` : `“${label}” isn't a supported file. Attach images, PDFs, Word, Excel, OpenDocument, CSV or text files.` };
  }
  if (size <= 0) return { ok: false, error: `“${label}” is empty.` };
  if (size > UPLOAD_LIMITS.maxFileBytes) {
    return { ok: false, error: `“${label}” is ${formatBytes(size)}. Files can be up to ${formatBytes(UPLOAD_LIMITS.maxFileBytes)}.` };
  }
  if (rule.kind === "convert" && size > UPLOAD_LIMITS.convertMaxBytes) {
    return {
      ok: false,
      error: `“${label}” is ${formatBytes(size)}. PDFs, images and Office files can be up to ${formatBytes(UPLOAD_LIMITS.convertMaxBytes)} (the document converter's limit); text files up to ${formatBytes(UPLOAD_LIMITS.maxFileBytes)}.`,
    };
  }
  return { ok: true, ext, rule };
}

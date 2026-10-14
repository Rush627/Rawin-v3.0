"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "./fields";
import FilePick from "./FilePick";
import ConfirmDialog from "./ConfirmDialog";
import { removeResumePdfAction, uploadResumePdfAction } from "@/app/saint-denis/content/actions";

export interface ResumePdf {
  filename: string;
  url: string;
  size?: number;
  updatedAt?: string;
}

const kb = (n?: number) => (n ? (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`) : "");

/** The published resume PDF: upload/replace (validated as a real PDF, up to 10 MB) or remove. */
export default function ResumePdfCard({ pdf }: { pdf: ResumePdf | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  const upload = async (file: File) => {
    setBusy("upload");
    setNote(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadResumePdfAction(fd).catch(() => ({ error: "The upload failed. Try again." }) as { error: string; success?: boolean; message?: string });
    setBusy(null);
    if (res.success) {
      setNote({ tone: "ok", text: res.message || "Published." });
      router.refresh();
    } else setNote({ tone: "error", text: res.error || "The upload failed." });
  };
  const remove = async () => {
    setBusy("remove");
    const res = await removeResumePdfAction().catch(() => ({ error: "The PDF could not be removed." }) as { error: string; success?: boolean; message?: string });
    setBusy(null);
    setConfirm(false);
    if (res.success) {
      setNote({ tone: "ok", text: res.message || "Removed." });
      router.refresh();
    } else setNote({ tone: "error", text: res.error || "The PDF could not be removed." });
  };

  return (
    <section aria-labelledby="resume-pdf-title" className="rounded-2xl border border-line bg-surface/70 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-11 h-11 shrink-0 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
            <FileText aria-hidden="true" className="w-5 h-5 text-fg-muted" />
          </span>
          <div className="min-w-0">
            <h2 id="resume-pdf-title" className="text-[15px] font-semibold text-fg">
              Resume PDF
            </h2>
            {pdf ? (
              <p className="text-[13px] text-fg-muted truncate">
                <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
                  {pdf.filename}
                </a>
                {pdf.size ? ` · ${kb(pdf.size)}` : ""}
                {pdf.updatedAt ? ` · ${new Date(pdf.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </p>
            ) : (
              <p className="text-[13px] text-fg-muted">None published · the download buttons are hidden.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilePick label={pdf ? "Replace PDF" : "Upload PDF"} accept="application/pdf,.pdf" busy={busy === "upload"} onFile={upload} describedBy="resume-pdf-hint" />
          {pdf && (
            <Button tone="ghost" onClick={() => setConfirm(true)} disabled={Boolean(busy)} className="text-danger hover:text-danger">
              <Trash2 aria-hidden="true" className="w-4 h-4" />
              Remove
            </Button>
          )}
        </div>
      </div>
      <p id="resume-pdf-hint" className="mt-3 text-[12.5px] text-fg-subtle">
        PDF only, up to 10 MB. The file is checked before it replaces the published one.
      </p>
      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`mt-2 text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
          {note.text}
        </p>
      )}
      <ConfirmDialog open={confirm} title="Remove the resume PDF?" confirmLabel="Remove PDF" destructive busy={busy === "remove"} onCancel={() => setConfirm(false)} onConfirm={remove}>
        Visitors will no longer be able to download your resume until a new PDF is uploaded.
      </ConfirmDialog>
    </section>
  );
}

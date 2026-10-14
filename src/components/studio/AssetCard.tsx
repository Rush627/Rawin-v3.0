"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button, TextField } from "./fields";
import FilePick from "./FilePick";
import ConfirmDialog from "./ConfirmDialog";
import { updateAssetAction } from "@/app/saint-denis/content/actions";

export type IdentitySlot = "profilePhoto" | "logoLight" | "logoDark" | "faviconLight" | "faviconDark";

const SLOT_COPY: Record<IdentitySlot, { title: string; use: string; accept: string; rule: string; surface: "light" | "dark" | "neutral"; fit: "cover" | "contain" }> = {
  profilePhoto: { title: "Profile photo", use: "Home hero, About page and link previews.", accept: "image/jpeg,image/png,image/webp", rule: "JPEG, PNG or WebP · up to 5 MB · square works best", surface: "neutral", fit: "cover" },
  logoLight: { title: "Logo · light theme", use: "Header logo on the light theme (dark ink on transparent).", accept: "image/png,image/webp", rule: "PNG or WebP with transparency · up to 2 MB", surface: "light", fit: "contain" },
  logoDark: { title: "Logo · dark theme", use: "Header logo on the dark theme (light ink on transparent).", accept: "image/png,image/webp", rule: "PNG or WebP with transparency · up to 2 MB", surface: "dark", fit: "contain" },
  faviconLight: { title: "Favicon · light theme", use: "Browser tab icon while the light theme is active.", accept: "image/png,image/webp,image/x-icon,.ico", rule: "Square PNG, WebP or ICO · 32–512 px · up to 1 MB", surface: "light", fit: "contain" },
  faviconDark: { title: "Favicon · dark theme", use: "Browser tab icon while the dark theme is active.", accept: "image/png,image/webp,image/x-icon,.ico", rule: "Square PNG, WebP or ICO · 32–512 px · up to 1 MB", surface: "dark", fit: "contain" },
};

/** One identity asset: preview on its intended surface, upload/replace, reset to built-in, alt text. */
export default function AssetCard({ slot, url, alt, uploaded }: { slot: IdentitySlot; url: string; alt: string; uploaded: boolean }) {
  const router = useRouter();
  const copy = SLOT_COPY[slot];
  const id = useId();
  const [busy, setBusy] = useState<"upload" | "reset" | "alt" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dims, setDims] = useState<string | null>(null);
  const [altText, setAltText] = useState(alt);
  const [confirmReset, setConfirmReset] = useState(false);

  const run = async (kind: "upload" | "reset" | "alt", fd: FormData) => {
    setBusy(kind);
    setNote(null);
    fd.append("assetType", slot);
    fd.append("action", kind);
    const res = await updateAssetAction(fd).catch(() => ({ error: "The server could not be reached." }) as { error?: string; success?: boolean; message?: string });
    setBusy(null);
    setConfirmReset(false);
    if (res.success) {
      setNote({ tone: "ok", text: res.message || "Saved." });
      router.refresh();
    } else setNote({ tone: "error", text: res.error || "Not saved." });
  };

  const surface = copy.surface === "light" ? "bg-[#f4f2ec]" : copy.surface === "dark" ? "bg-[#0b0b10]" : "bg-surface-2";
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-line bg-surface/70 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="text-[15px] font-semibold text-fg">
            {copy.title}
          </h3>
          <p className="mt-0.5 text-[13px] text-fg-muted">{copy.use}</p>
        </div>
        <span className={`shrink-0 label-mono ${uploaded ? "text-accent" : "text-fg-subtle"}`}>{uploaded ? "Custom upload active" : "Built-in active"}</span>
      </div>
      <div className={`relative rounded-xl border border-line ${surface} ${slot === "profilePhoto" ? "aspect-square w-40" : slot.startsWith("favicon") ? "h-28" : "h-24"} flex items-center justify-center overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          onLoad={(e) => setDims(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}px`)}
          className={copy.fit === "cover" ? "w-full h-full object-cover" : slot.startsWith("favicon") ? "w-16 h-16 object-contain" : "max-h-10 max-w-[85%] object-contain"}
        />
      </div>
      <p id={`${id}-rule`} className="text-[12.5px] text-fg-subtle">
        {copy.rule}
        {dims ? ` · current ${dims}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <FilePick
          label={uploaded ? "Replace" : "Upload"}
          accept={copy.accept}
          busy={busy === "upload"}
          describedBy={`${id}-rule`}
          onFile={(file) => {
            const fd = new FormData();
            fd.append("file", file);
            if (altText) fd.append("alt", altText);
            run("upload", fd);
          }}
        />
        {uploaded && (
          <Button tone="ghost" onClick={() => setConfirmReset(true)} disabled={Boolean(busy)}>
            <RotateCcw aria-hidden="true" className="w-4 h-4" />
            Use built-in
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <TextField label="Description (alt text)" value={altText} onChange={setAltText} maxLength={200} className="flex-1" />
        <Button
          tone="secondary"
          disabled={altText === alt}
          busy={busy === "alt"}
          onClick={() => {
            const fd = new FormData();
            fd.append("alt", altText);
            run("alt", fd);
          }}
        >
          Save description
        </Button>
      </div>
      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
          {note.text}
        </p>
      )}
      <ConfirmDialog open={confirmReset} title={`Use the built-in ${copy.title.toLowerCase()}?`} confirmLabel="Use built-in" busy={busy === "reset"} onCancel={() => setConfirmReset(false)} onConfirm={() => run("reset", new FormData())}>
        Your uploaded file is removed and the bundled RAWIN version is shown instead.
      </ConfirmDialog>
    </section>
  );
}

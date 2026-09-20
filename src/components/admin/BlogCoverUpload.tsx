"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { uploadBlogCoverAction, removeBlogCoverAction } from "@/app/admin/blog/actions";

interface BlogCoverUploadProps {
  postId?: string;
  currentCoverUrl?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function BlogCoverUpload({
  postId,
  currentCoverUrl = "",
}: BlogCoverUploadProps) {
  const [coverUrl, setCoverUrl] = useState<string>(currentCoverUrl);
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removeMarked, setRemoveMarked] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine active preview URL: local blob URL takes precedence, then server URL
  const activePreview = previewBlob || (!removeMarked ? coverUrl : null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatusMessage({
        type: "error",
        text: "Invalid file format. Please choose a JPEG, PNG, or WebP image.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setStatusMessage({
        type: "error",
        text: "File is too large. Maximum allowed size is 5 MB.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFilename(file.name);
    setRemoveMarked(false);

    // If existing post, trigger server action immediately
    if (postId) {
      const blobUrl = URL.createObjectURL(file);
      setPreviewBlob(blobUrl);

      const formData = new FormData();
      formData.append("cover", file);

      startTransition(async () => {
        try {
          const res = await uploadBlogCoverAction(postId, formData);
          if (res.error) {
            setStatusMessage({ type: "error", text: res.error });
            setPreviewBlob(null);
          } else if (res.url) {
            setCoverUrl(res.url);
            setPreviewBlob(null);
            setStatusMessage({
              type: "success",
              text: "Cover image uploaded and saved successfully.",
            });
          }
        } catch {
          setStatusMessage({
            type: "error",
            text: "Failed to upload image. Please try again.",
          });
          setPreviewBlob(null);
        }
      });
    } else {
      // New post: generate local blob preview; form submit will upload the binary
      const blobUrl = URL.createObjectURL(file);
      setPreviewBlob(blobUrl);
      setStatusMessage({
        type: "success",
        text: "Image selected. It will be uploaded when you save this article.",
      });
    }
  };

  const handleRemove = () => {
    setStatusMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (postId && coverUrl) {
      startTransition(async () => {
        try {
          const res = await removeBlogCoverAction(postId);
          if (res.error) {
            setStatusMessage({ type: "error", text: res.error });
          } else {
            setCoverUrl("");
            setPreviewBlob(null);
            setFilename("");
            setRemoveMarked(true);
            setStatusMessage({
              type: "success",
              text: "Cover image removed.",
            });
          }
        } catch {
          setStatusMessage({
            type: "error",
            text: "Failed to remove cover image. Please try again.",
          });
        }
      });
    } else {
      setCoverUrl("");
      setPreviewBlob(null);
      setFilename("");
      setRemoveMarked(true);
      setStatusMessage({
        type: "success",
        text: "Cover image cleared.",
      });
    }
  };

  const triggerSelect = () => {
    if (isPending) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.08]">
      {/* Label and status */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-pacific-cyan" />
          Article Cover Image
        </label>
        <span className="text-[10px] sm:text-[11px] font-mono text-muted/60">Optional · PNG, JPG, WebP · Max 5 MB</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        name="cover"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isPending}
        className="hidden"
        aria-label="Upload Cover Image"
      />

      {/* Hidden field for form data preservation */}
      <input type="hidden" name="coverImage" value={activePreview ? coverUrl : ""} />
      {removeMarked && <input type="hidden" name="removeCover" value="true" />}

      {/* Visual Preview / Upload Box */}
      {activePreview ? (
        <div className="relative group rounded-xl border border-white/[0.12] bg-ink-black/60 overflow-hidden transition-all duration-300">
          {/* Image Container with sensible aspect ratio */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-56 bg-ink-black/90 flex items-center justify-center overflow-hidden">
            {/* Native img avoids external domain issues with temporary blob URLs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePreview}
              alt="Article cover preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 bg-ink-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-pacific-cyan z-10">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono">Processing cover image...</span>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] border-t border-white/[0.08]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs font-mono text-foreground truncate max-w-[200px] sm:max-w-xs">
                {filename || (coverUrl ? "Uploaded cover active" : "Selected image")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerSelect}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-foreground bg-white/[0.06] hover:bg-pacific-cyan/15 hover:text-pacific-cyan border border-white/[0.1] hover:border-pacific-cyan/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-rose-400/90 bg-rose-500/[0.08] hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Drop Area */
        <button
          type="button"
          onClick={triggerSelect}
          disabled={isPending}
          className="group relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border border-dashed border-white/[0.15] hover:border-pacific-cyan/50 bg-ink-black/40 hover:bg-pacific-cyan/[0.02] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] group-hover:bg-pacific-cyan/10 border border-white/[0.08] group-hover:border-pacific-cyan/30 flex items-center justify-center transition-colors">
            {isPending ? (
              <Loader2 className="w-5 h-5 text-pacific-cyan animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-muted group-hover:text-pacific-cyan transition-colors" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground group-hover:text-pacific-cyan transition-colors">
              Upload Cover Image
            </span>
            <span className="text-xs font-mono text-muted/70">
              Drag and drop or click to browse · PNG, JPG, WebP up to 5 MB
            </span>
          </div>
        </button>
      )}

      {/* Subtle Feedback Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}

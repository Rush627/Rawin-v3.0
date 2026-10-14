"use client";

import { useState, useRef, useTransition } from "react";
import PublicImagePreview from "@/components/studio/PublicImagePreview";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { uploadBlogCoverAction, removeBlogCoverAction } from "@/app/saint-denis/blog/actions";

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
    <div className="flex flex-col gap-3 pt-3 border-t border-line">
      {/* Label and status */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs font-mono text-fg-muted uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-accent" />
          Article Cover Image
        </label>
        <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60">Optional · PNG, JPG, WebP · Max 5 MB</span>
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
        <div className="relative rounded-xl border border-line-strong bg-surface overflow-hidden">
          {/* Same box, crop and radius as the public page, at desktop or smartphone size */}
          <PublicImagePreview src={activePreview} kind="article">
            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 bg-surface backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-accent z-10">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono">Processing cover image...</span>
              </div>
            )}
          </PublicImagePreview>

          {/* Action Toolbar */}
          <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-2/60 border-t border-line">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              <span className="text-xs font-mono text-fg truncate max-w-[200px] sm:max-w-xs">
                {filename || (coverUrl ? "Uploaded cover active" : "Selected image")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerSelect}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-fg bg-surface-2 hover:bg-accent/15 hover:text-accent border border-line hover:border-accent/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-danger/90 bg-danger/[0.08] hover:bg-danger/20 border border-danger/20 hover:border-danger/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          className="group relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border border-dashed border-line-strong hover:border-accent/50 bg-surface hover:bg-accent/[0.02] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-2 group-hover:bg-accent/10 border border-line group-hover:border-accent/30 flex items-center justify-center transition-colors">
            {isPending ? (
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-fg-muted group-hover:text-accent transition-colors" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg group-hover:text-accent transition-colors">
              Upload Cover Image
            </span>
            <span className="text-xs font-mono text-fg-muted/70">
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
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20"
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

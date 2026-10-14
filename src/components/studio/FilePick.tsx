"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "./fields";

/**
 * File chooser as a real, focusable button (the native input stays hidden). On phones an
 * image `accept` offers the camera, photo library and Files; documents offer Files.
 */
export default function FilePick({ label, accept, busy, onFile, describedBy, tone = "secondary" }: {
  label: string;
  accept: string;
  busy?: boolean;
  onFile: (file: File) => void;
  describedBy?: string;
  tone?: "primary" | "secondary";
}) {
  const input = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <Button tone={tone} busy={busy} onClick={() => input.current?.click()} aria-describedby={describedBy}>
        {!busy && <Upload aria-hidden="true" className="w-4 h-4" />}
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

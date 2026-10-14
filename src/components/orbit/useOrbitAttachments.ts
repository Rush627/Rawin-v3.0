"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UPLOAD_LIMITS, formatBytes, preflight, sanitizeFileName, type UploadFamily } from "@/lib/aura/upload-policy";

/**
 * Orbit composer attachments: each chosen file is checked locally (type, 50 MB), uploaded in
 * raw chunks with real progress, then processed on the server (converted to text) before it
 * counts as ready. States: uploading → processing → ready | failed; failed items can be
 * retried, any item can be removed (an in-flight upload is cancelled and deleted).
 */

export type AttachmentState = "uploading" | "processing" | "ready" | "failed";

export interface OrbitAttachment {
  key: string;
  name: string;
  size: number;
  family: UploadFamily;
  state: AttachmentState;
  /** 0–1 while uploading */
  progress: number;
  error?: string;
  /** object URL for image thumbnails (revoked on removal) */
  preview?: string;
  /** server upload id + ownership token, once started */
  id?: string;
  token?: string;
  /** characters of text extracted (when ready) */
  chars?: number;
  truncated?: boolean;
}

export interface SentAttachment {
  name: string;
  family: UploadFamily;
}

async function errorOf(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    // not JSON
  }
  return fallback;
}

export function useOrbitAttachments() {
  const [items, setItems] = useState<OrbitAttachment[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const files = useRef(new Map<string, File>());
  const controllers = useRef(new Map<string, AbortController>());
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = useCallback((key: string, next: Partial<OrbitAttachment>) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...next } : it)));
  }, []);

  const upload = useCallback(
    async (key: string) => {
      const file = files.current.get(key);
      if (!file) return;
      const controller = new AbortController();
      controllers.current.set(key, controller);
      const { signal } = controller;
      patch(key, { state: "uploading", progress: 0, error: undefined });
      try {
        const start = await fetch("/api/ai/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size }),
          signal,
        });
        if (!start.ok) throw new Error(await errorOf(start, "The upload couldn't start."));
        const { id, token, chunkBytes, parts } = (await start.json()) as { id: string; token: string; chunkBytes: number; parts: number };
        patch(key, { id, token });

        for (let i = 0; i < parts; i++) {
          const blob = file.slice(i * chunkBytes, Math.min(file.size, (i + 1) * chunkBytes));
          let res: Response | null = null;
          // one quiet retry per chunk for flaky mobile connections
          for (let attempt = 0; attempt < 2; attempt++) {
            res = await fetch(`/api/ai/uploads/${id}?index=${i}`, {
              method: "PUT",
              headers: { "Content-Type": "application/octet-stream", "x-upload-token": token },
              body: blob,
              signal,
            }).catch((err) => {
              if (signal.aborted) throw err;
              return null;
            });
            if (res?.ok) break;
          }
          if (!res?.ok) throw new Error(res ? await errorOf(res, "The upload was interrupted.") : "The upload was interrupted. Check your connection.");
          patch(key, { progress: (i + 1) / parts });
        }

        patch(key, { state: "processing", progress: 1 });
        const done = await fetch(`/api/ai/uploads/${id}/complete`, { method: "POST", headers: { "x-upload-token": token }, signal });
        if (!done.ok) throw new Error(await errorOf(done, "The file couldn't be processed."));
        const result = (await done.json()) as { status: string; error?: string; chars?: number; truncated?: boolean };
        if (result.status !== "ready") throw new Error(result.error || "The file couldn't be processed.");
        patch(key, { state: "ready", chars: result.chars, truncated: result.truncated });
      } catch (err) {
        if (signal.aborted) return;
        patch(key, { state: "failed", error: err instanceof Error ? err.message : "The upload failed." });
      } finally {
        controllers.current.delete(key);
      }
    },
    [patch],
  );

  const add = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      setNotice(null);
      const current = itemsRef.current;
      let count = current.length;
      let total = current.reduce((n, it) => n + it.size, 0);
      const fresh: OrbitAttachment[] = [];
      const problems: string[] = [];
      for (const file of Array.from(list)) {
        if (count >= UPLOAD_LIMITS.maxFiles) {
          problems.push(`Attach up to ${UPLOAD_LIMITS.maxFiles} files per message.`);
          break;
        }
        const check = preflight(file.name, file.size);
        if (!check.ok) {
          problems.push(check.error);
          continue;
        }
        if (total + file.size > UPLOAD_LIMITS.maxTotalBytes) {
          problems.push(`Files in one message can add up to ${formatBytes(UPLOAD_LIMITS.maxTotalBytes)}.`);
          continue;
        }
        const key = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;
        files.current.set(key, file);
        count++;
        total += file.size;
        fresh.push({
          key,
          name: sanitizeFileName(file.name),
          size: file.size,
          family: check.rule.family,
          state: "uploading",
          progress: 0,
          preview: check.rule.family === "image" ? URL.createObjectURL(file) : undefined,
        });
      }
      if (problems.length) setNotice(problems.join(" "));
      if (!fresh.length) return;
      setItems((prev) => [...prev, ...fresh]);
      fresh.forEach((it) => void upload(it.key));
    },
    [upload],
  );

  const forget = useCallback((it: OrbitAttachment, discard: boolean) => {
    controllers.current.get(it.key)?.abort();
    controllers.current.delete(it.key);
    files.current.delete(it.key);
    if (it.preview) URL.revokeObjectURL(it.preview);
    if (discard && it.id && it.token) {
      void fetch(`/api/ai/uploads/${it.id}`, { method: "DELETE", headers: { "x-upload-token": it.token } }).catch(() => undefined);
    }
  }, []);

  const remove = useCallback(
    (key: string) => {
      const it = itemsRef.current.find((x) => x.key === key);
      if (it) forget(it, true);
      setItems((prev) => prev.filter((x) => x.key !== key));
    },
    [forget],
  );

  const retry = useCallback((key: string) => void upload(key), [upload]);

  /** Hand the ready attachments to a message (the list empties; server copies expire on their own). */
  const take = useCallback(() => {
    const ready = itemsRef.current.filter((it) => it.state === "ready" && it.id && it.token);
    itemsRef.current.forEach((it) => forget(it, it.state !== "ready"));
    setItems([]);
    setNotice(null);
    return {
      refs: ready.map((it) => ({ id: it.id as string, token: it.token as string })),
      sent: ready.map<SentAttachment>((it) => ({ name: it.name, family: it.family })),
    };
  }, [forget]);

  const clear = useCallback(() => {
    itemsRef.current.forEach((it) => forget(it, true));
    setItems([]);
    setNotice(null);
  }, [forget]);

  // release previews and cancel uploads when the page goes away
  useEffect(() => {
    const ctrls = controllers.current;
    return () => {
      ctrls.forEach((c) => c.abort());
      itemsRef.current.forEach((it) => it.preview && URL.revokeObjectURL(it.preview));
    };
  }, []);

  const busy = items.some((it) => it.state === "uploading" || it.state === "processing");
  return { items, notice, setNotice, add, remove, retry, take, clear, busy };
}

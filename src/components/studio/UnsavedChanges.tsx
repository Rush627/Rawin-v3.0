"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";

interface UnsavedApi {
  /** Mark (or clear) an editor as having unsaved changes. */
  setDirty: (key: string, dirty: boolean) => void;
  /** Ask before an action that would discard unsaved changes; resolves true to proceed. */
  confirmLeave: () => Promise<boolean>;
  anyDirty: boolean;
}

const UnsavedContext = createContext<UnsavedApi>({ setDirty: () => {}, confirmLeave: async () => true, anyDirty: false });

export function useUnsavedChanges() {
  return useContext(UnsavedContext);
}

/**
 * Keeps unsaved edits from being lost: closing or reloading the tab triggers the browser's
 * own prompt, and following an in-app link from a dirty editor asks first.
 * (The browser back button cannot be intercepted reliably in the App Router; the tab-close
 * prompt still applies when it leaves the site.)
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dirtyKeys, setDirtyKeys] = useState<string[]>([]);
  const [pending, setPending] = useState<{ resolve: (ok: boolean) => void } | null>(null);
  const anyDirty = dirtyKeys.length > 0;
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = anyDirty;
  }, [anyDirty]);

  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeys((keys) => {
      const has = keys.includes(key);
      if (dirty && !has) return [...keys, key];
      if (!dirty && has) return keys.filter((k) => k !== key);
      return keys;
    });
  }, []);

  const confirmLeave = useCallback(() => {
    if (!dirtyRef.current) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => setPending({ resolve }));
  }, []);

  // tab close / reload
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  // in-app links (capture phase, before Next's Link handler)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.skipUnsaved !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      setPending({
        resolve: (ok) => {
          if (ok) {
            dirtyRef.current = false;
            setDirtyKeys([]);
            router.push(url.pathname + url.search + url.hash);
          }
        },
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  const api = useMemo(() => ({ setDirty, confirmLeave, anyDirty }), [setDirty, confirmLeave, anyDirty]);

  return (
    <UnsavedContext.Provider value={api}>
      {children}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Leave without saving?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onCancel={() => {
          pending?.resolve(false);
          setPending(null);
        }}
        onConfirm={() => {
          pending?.resolve(true);
          setPending(null);
        }}
      >
        Your unsaved changes on this page will be lost.
      </ConfirmDialog>
    </UnsavedContext.Provider>
  );
}

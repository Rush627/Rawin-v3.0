"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./fields";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation: focus moves to the safe choice (Cancel) when it opens, Tab stays inside,
 * Escape and the backdrop cancel, and focus returns to whatever opened it. Full width at the
 * bottom of the screen on phones, centred on larger screens.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Cancel", destructive, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy) onCancel();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6" data-admin-portal="true">
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" onClick={() => !busy && onCancel()} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={children ? `${id}-body` : undefined}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-line bg-bg-raised p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-3)]"
      >
        <h2 id={`${id}-title`} className="text-[17px] font-semibold text-fg">
          {title}
        </h2>
        {children && (
          <div id={`${id}-body`} className="mt-2 text-[14px] text-fg-muted leading-relaxed">
            {children}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Button ref={cancelRef} tone="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button tone={destructive ? "danger" : "primary"} busy={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

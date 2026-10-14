"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft, ArrowUpRight } from "lucide-react";
import FuzzyText from "@/components/system/FuzzyText";
import Wordmark, { type WordmarkProps } from "@/components/shell/Wordmark";
import { SITE_HOST } from "@/lib/site-url";

export interface RawinErrorViewProps {
  code: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  onExpire?: () => void;
  maintenanceMessage?: string;
  endsAt?: string | null;
  /** Secondary route offered beside the primary action (e.g. home after a failed page) */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Short, non-sensitive incident reference to quote (e.g. Next.js error digest) */
  reference?: string;
  /** Header brand presentation: typographic wordmark (default) or uploaded logo */
  brandMode?: WordmarkProps["mode"];
  /** Light/dark logo asset variants */
  logos?: WordmarkProps["logos"];
}

function formatRemaining(totalMs: number): string {
  if (totalMs <= 0) return "00:00";
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const STATE_LABEL: Record<string, string> = {
  "404": "Signal lost",
  "500": "System fault",
  "503": "Scheduled maintenance",
  OFFLINE: "No connection",
};

/**
 * Full-viewport system state (404, errors, maintenance, offline). Self-contained:
 * it carries its own atmosphere so it renders correctly as a standalone screen,
 * inside the public layout, or from the global error boundary.
 *
 * Composition: a running header (canonical brand · status), then one editorial block —
 * the code set proportionally (never crowding mobile screens), a hairline, and the message
 * column — and a quiet footer (domain · reference · year). On smartphones, proportions
 * adapt gracefully so all key controls and status badges fit within one viewport without
 * accidental clipping or scrolling.
 */
export default function RawinErrorView({
  code,
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  onExpire,
  maintenanceMessage,
  endsAt,
  secondaryHref,
  secondaryLabel,
  reference,
  brandMode = "wordmark",
  logos,
}: RawinErrorViewProps) {
  const [remainingText, setRemainingText] = useState<string | null>(null);
  const hasReloadedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!endsAt) return;

    const targetTime = new Date(endsAt).getTime();
    if (isNaN(targetTime)) return;

    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setRemainingText(null);
        if (onExpireRef.current) {
          onExpireRef.current();
        } else if (!hasReloadedRef.current) {
          hasReloadedRef.current = true;
          window.location.reload();
        }
        return;
      }
      setRemainingText(formatRemaining(diff));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-error-active", "true");
      return () => {
        document.documentElement.removeAttribute("data-error-active");
      };
    }
  }, []);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      window.location.reload();
    }
  };

  const resolvedActionLabel =
    actionLabel ||
    (actionHref
      ? "Back to home"
      : code === "OFFLINE"
      ? "Retry"
      : "Refresh");

  const countdown = endsAt ? remainingText : null;
  const display = code === "OFFLINE" ? "Offline" : code;
  const isWord = display.length > 3;
  const stateLabel = STATE_LABEL[code] || "System state";
  const tone = code === "503" ? "bg-warning" : code === "OFFLINE" ? "bg-fg-subtle" : "bg-danger";

  return (
    <main
      role="main"
      data-error-view="true"
      className="relative w-full h-full min-h-screen min-h-dvh flex flex-col justify-between bg-bg text-fg overflow-x-hidden overflow-y-auto overscroll-contain"
    >
      {/* Atmosphere: one soft halo behind the code, nothing else */}
      <div aria-hidden="true" className="rawin-atmosphere !absolute" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 lg:left-[30%] top-[38%] lg:top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(120vw,820px)] aspect-square rounded-full pointer-events-none rawin-error-halo"
        style={{ background: "radial-gradient(circle, var(--halo-a) 0%, transparent 60%)" }}
      />

      {/* Running header */}
      <header className="relative z-10 shrink-0 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-4 pb-3 sm:pb-5 border-b border-line">
          <span className="inline-flex items-center text-fg">
            <Wordmark mode={brandMode} logos={logos} size="sm" withMark={false} />
          </span>
          <span className="inline-flex items-center gap-2 label-mono text-fg-muted text-xs sm:text-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${tone}`} />
            <span className="text-fg">{display}</span>
            <span className="text-fg-subtle hidden sm:inline">· {stateLabel}</span>
          </span>
        </div>
      </header>

      {/* Composition */}
      <div className="relative z-10 flex-1 my-auto mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 flex items-center py-3 sm:py-8 lg:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-y-3 sm:gap-y-6 lg:gap-x-12 items-center">
          {/* FuzzyText pads its canvas by fuzzRange + 12px; below lg that padding is pulled back
              so the glyphs start on the content gutter like the copy beneath them */}
          <div
            className="lg:col-span-5 lg:justify-self-end max-lg:ml-[calc(var(--fz)*-1)]"
            style={{ "--fz": `${(isWord ? 14 : 18) + 8}px` } as React.CSSProperties}
          >
            <FuzzyText
              fontSize={isWord ? "clamp(2.4rem, 10vw, 8.5rem)" : "clamp(3.4rem, 15vw, 12.5rem)"}
              fontWeight={400}
              fontFamily="var(--font-display)"
              color="var(--fg)"
              baseIntensity={0.12}
              hoverIntensity={0.5}
              fuzzRange={isWord ? 14 : 18}
            >
              {display}
            </FuzzyText>
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-line lg:pl-12 max-w-[36rem]">
            <p className="label-mono text-accent text-xs sm:text-sm">{stateLabel}</p>
            <h1 className="mt-2 sm:mt-4 font-display text-[clamp(1.75rem,5.5vw,3.6rem)] lg:text-[clamp(2.4rem,3.4vw,3.6rem)] leading-[0.98] tracking-[-0.03em] text-fg text-balance">
              {title}
            </h1>
            <p className="mt-2 sm:mt-4 text-[13.5px] sm:text-[16px] text-fg-muted leading-relaxed max-w-[44ch]">{message}</p>

            {maintenanceMessage && (
              <div className="mt-3.5 sm:mt-6 rounded-2xl border border-line bg-surface/80 p-3.5 sm:p-5 shadow-[var(--shadow-2)]">
                <span className="label-mono text-fg-subtle text-[11px] sm:text-xs">Notice from the administrator</span>
                <p className="mt-1.5 text-[13px] sm:text-[14.5px] whitespace-pre-wrap leading-relaxed text-fg">{maintenanceMessage}</p>
              </div>
            )}

            <div className="mt-3.5 sm:mt-7 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2.5 sm:gap-y-3">
              {actionHref ? (
                <Link href={actionHref} className="btn btn-primary btn-sm sm:btn-md group">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>{resolvedActionLabel}</span>
                </Link>
              ) : (
                <button type="button" onClick={handleAction} className="btn btn-primary btn-sm sm:btn-md group">
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" />
                  <span>{resolvedActionLabel}</span>
                </button>
              )}
              {secondaryHref && (
                <Link href={secondaryHref} className="group inline-flex items-center gap-2 min-h-10 sm:min-h-12 text-xs sm:text-sm font-medium text-fg">
                  <span className="link-draw">{secondaryLabel || "Back to home"}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
              {countdown && (
                <span className="inline-flex items-center gap-2 h-9 sm:h-12 px-3.5 sm:px-5 rounded-full border border-line-strong font-mono text-xs sm:text-sm text-fg" aria-live="polite">
                  <span className="status-dot text-warning" />
                  <span className="tabular-nums">{countdown}</span>
                  <span className="text-fg-subtle">remaining</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 shrink-0 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pt-3 sm:pt-5 border-t border-line flex items-center justify-between gap-4 label-mono text-xs sm:text-sm text-fg-subtle">
          <span>{SITE_HOST}</span>
          {reference && <span className="hidden sm:inline truncate">Ref · {reference}</span>}
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}


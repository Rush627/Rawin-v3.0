"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft, ArrowUpRight } from "lucide-react";
import FuzzyText from "@/components/system/FuzzyText";
import Wordmark, { type WordmarkProps } from "@/components/shell/Wordmark";
import { SITE_HOST } from "@/lib/site-url";
import { useSystemScreen } from "@/components/audio/useSystemScreen";

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

  // no background ambience and no startup while this screen is shown; clicks stay available
  useSystemScreen();

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

  // undefined: no timed window; null: not computed yet (a placeholder keeps the row steady)
  const countdown = endsAt && !Number.isNaN(new Date(endsAt).getTime()) ? remainingText : undefined;
  const display = code === "OFFLINE" ? "Offline" : code;
  const isWord = display.length > 3;
  const stateLabel = STATE_LABEL[code] || "System state";
  const tone = code === "503" ? "bg-warning" : code === "OFFLINE" ? "bg-fg-subtle" : "bg-danger";

  return (
    <main
      role="main"
      data-error-view="true"
      className="rawin-state relative w-full min-h-viewport flex flex-col bg-bg text-fg overflow-clip"
    >
      {/* Atmosphere: one soft halo behind the code, nothing else */}
      <div aria-hidden="true" className="rawin-atmosphere !absolute" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 lg:left-[30%] top-[38%] lg:top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(120vw,820px)] aspect-square rounded-full pointer-events-none rawin-error-halo"
        style={{ background: "radial-gradient(circle, var(--halo-a) 0%, transparent 60%)" }}
      />

      {/* Running header */}
      <header className="rawin-state-gutter relative z-10 shrink-0 mx-auto w-full max-w-[1400px] pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-4 min-h-10 pb-2.5 sm:pb-4 border-b border-line">
          <span className="inline-flex items-center text-fg">
            <Wordmark mode={brandMode} logos={logos} size="sm" withMark={false} />
          </span>
          <span className="inline-flex items-center gap-2 label-mono text-fg-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${tone}`} />
            <span className="text-fg">{display}</span>
            <span className="text-fg-subtle hidden sm:inline">· {stateLabel}</span>
          </span>
        </div>
      </header>

      {/* Composition: centred in the height left between header and footer. Phones stack and
          centre everything; desktop sets the code and the message side by side. */}
      <div className="rawin-state-gutter relative z-10 flex-1 mx-auto w-full max-w-[1400px] flex items-center justify-center py-[clamp(0.75rem,3dvh,3rem)]">
        <div className="w-full flex flex-col items-center text-center lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-center lg:text-left">
          <div className="lg:col-span-5 lg:justify-self-end flex justify-center">
            <FuzzyText
              fontSize={isWord ? "var(--rawin-state-word)" : "var(--rawin-state-code)"}
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

          <div className="mt-[clamp(0.5rem,1.6dvh,1.5rem)] lg:mt-0 lg:col-span-7 lg:border-l lg:border-line lg:pl-12 w-full max-w-[34rem] flex flex-col items-center lg:items-start">
            <p className="label-mono text-accent">{stateLabel}</p>
            <h1 className="mt-[clamp(0.35rem,1.1dvh,1rem)] font-display text-[clamp(1.65rem,min(7.6vw,4.9dvh),2.6rem)] sm:text-[clamp(2.2rem,5vw,3.2rem)] lg:text-[clamp(2.6rem,3.6vw,3.6rem)] leading-[1] tracking-[-0.03em] text-fg text-balance">
              {title}
            </h1>
            <p className="mt-[clamp(0.35rem,1.2dvh,1.1rem)] text-[14px] sm:text-[16px] lg:text-[17px] text-fg-muted leading-snug sm:leading-relaxed max-w-[38ch] text-balance">{message}</p>

            {maintenanceMessage && (
              <div className="mt-[clamp(0.6rem,2dvh,1.75rem)] w-full max-w-[26rem] lg:max-w-none rounded-2xl border border-line bg-surface/80 px-4 py-3 sm:px-5 sm:py-4 shadow-[var(--shadow-2)]">
                <span className="label-mono text-fg-subtle">Notice from the administrator</span>
                <p className="mt-1 text-[13.5px] sm:text-[15px] whitespace-pre-wrap leading-snug sm:leading-relaxed text-fg line-clamp-6">{maintenanceMessage}</p>
              </div>
            )}

            {/* One row: the action on the left, the remaining time on the right (phones);
                desktop keeps them side by side from the left edge of the column */}
            <div
              className={`rawin-state-actions mt-[clamp(0.75rem,2.2dvh,2rem)] w-full flex flex-wrap items-center gap-x-3 gap-y-2 lg:gap-x-6 ${
                countdown !== undefined ? "max-w-[26rem] lg:max-w-none justify-between lg:justify-start" : "justify-center lg:justify-start"
              }`}
            >
              {actionHref ? (
                <Link href={actionHref} className="btn btn-primary group shrink-0">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>{resolvedActionLabel}</span>
                </Link>
              ) : (
                <button type="button" onClick={handleAction} className="btn btn-primary group shrink-0">
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" />
                  <span>{resolvedActionLabel}</span>
                </button>
              )}
              {secondaryHref && (
                <Link href={secondaryHref} className="group inline-flex items-center gap-2 min-h-11 text-sm font-medium text-fg">
                  <span className="link-draw">{secondaryLabel || "Back to home"}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
              {countdown !== undefined && (
                <span
                  className="rawin-state-countdown inline-flex items-center gap-2 shrink-0 rounded-full border border-line-strong font-mono text-fg whitespace-nowrap"
                  aria-live="polite"
                >
                  <span className="status-dot text-warning" />
                  <span className="tabular-nums">{countdown ?? "--:--"}</span>
                  <span className="text-fg-subtle">remaining</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="rawin-state-gutter relative z-10 shrink-0 mx-auto w-full max-w-[1400px] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="pt-2.5 sm:pt-4 border-t border-line flex items-center justify-between gap-4 label-mono text-fg-subtle">
          <span>{SITE_HOST}</span>
          {reference && <span className="hidden sm:inline truncate">Ref · {reference}</span>}
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

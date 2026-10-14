"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft, ArrowUpRight } from "lucide-react";
import FuzzyText from "@/components/system/FuzzyText";
import BrandMark from "@/components/shell/BrandMark";
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
 * Composition: a running header (brand · status), then one editorial block — the code set
 * large but bounded (it never outweighs the explanation), a hairline, and the message
 * column — and a quiet footer (domain · reference · year). Desktop places code and message
 * side by side on a shared baseline; phones stack them compactly so everything, including
 * the action, fits without scrolling.
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
      className="relative w-full min-h-screen min-h-dvh flex flex-col bg-bg text-fg overflow-hidden"
    >
      {/* Atmosphere: one soft halo behind the code, nothing else */}
      <div aria-hidden="true" className="rawin-atmosphere !absolute" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 lg:left-[30%] top-[38%] lg:top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(120vw,820px)] aspect-square rounded-full pointer-events-none rawin-error-halo"
        style={{ background: "radial-gradient(circle, var(--halo-a) 0%, transparent 60%)" }}
      />

      {/* Running header */}
      <header className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-line">
          <span className="inline-flex items-center gap-2 text-fg">
            <BrandMark className="w-6 h-6" />
            <span className="tracking-[0.28em] font-sans font-semibold text-[12px]">RAWIN</span>
          </span>
          <span className="inline-flex items-center gap-2 label-mono text-fg-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${tone}`} />
            <span className="text-fg">{display}</span>
            <span className="text-fg-subtle hidden sm:inline">· {stateLabel}</span>
          </span>
        </div>
      </header>

      {/* Composition */}
      <div className="relative z-10 flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 flex items-center py-10 sm:py-14">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-y-6 sm:gap-y-8 lg:gap-x-12 items-center">
          {/* FuzzyText pads its canvas by fuzzRange + 12px; below lg that padding is pulled back
              so the glyphs start on the content gutter like the copy beneath them */}
          <div
            className="lg:col-span-5 lg:justify-self-end max-lg:ml-[calc(var(--fz)*-1)]"
            style={{ "--fz": `${(isWord ? 18 : 24) + 12}px` } as React.CSSProperties}
          >
            <FuzzyText
              fontSize={isWord ? "clamp(3.4rem, 15vw, 8.5rem)" : "clamp(5.5rem, 27vw, 12.5rem)"}
              fontWeight={400}
              fontFamily="var(--font-display)"
              color="var(--fg)"
              baseIntensity={0.12}
              hoverIntensity={0.5}
              fuzzRange={isWord ? 18 : 24}
            >
              {display}
            </FuzzyText>
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-line lg:pl-12 max-w-[36rem]">
            <p className="label-mono text-accent">{stateLabel}</p>
            <h1 className="mt-3 sm:mt-4 font-display text-[clamp(2.1rem,7.5vw,3.6rem)] lg:text-[clamp(2.6rem,3.6vw,3.6rem)] leading-[0.98] tracking-[-0.03em] text-fg text-balance">
              {title}
            </h1>
            <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-fg-muted leading-relaxed max-w-[44ch]">{message}</p>

            {maintenanceMessage && (
              <div className="mt-6 sm:mt-8 rounded-[20px] border border-line bg-surface/80 p-5 sm:p-6 shadow-[var(--shadow-2)]">
                <span className="label-mono text-fg-subtle">Notice from the administrator</span>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-fg">{maintenanceMessage}</p>
              </div>
            )}

            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              {actionHref ? (
                <Link href={actionHref} className="btn btn-primary group">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>{resolvedActionLabel}</span>
                </Link>
              ) : (
                <button type="button" onClick={handleAction} className="btn btn-primary group">
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" />
                  <span>{resolvedActionLabel}</span>
                </button>
              )}
              {secondaryHref && (
                <Link href={secondaryHref} className="group inline-flex items-center gap-2 min-h-12 text-sm font-medium text-fg">
                  <span className="link-draw">{secondaryLabel || "Back to home"}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
              {countdown && (
                <span className="inline-flex items-center gap-2.5 h-12 px-5 rounded-full border border-line-strong font-mono text-sm text-fg" aria-live="polite">
                  <span className="status-dot text-warning" />
                  <span className="tabular-nums">{countdown}</span>
                  <span className="text-fg-subtle">remaining</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="pt-4 sm:pt-5 border-t border-line flex items-center justify-between gap-4 label-mono text-fg-subtle">
          <span>{SITE_HOST}</span>
          {reference && <span className="hidden sm:inline truncate">Ref · {reference}</span>}
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

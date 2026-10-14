"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type LoginActionState } from "../actions";
import Wordmark from "@/components/shell/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/saint-denis";
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(loginAction, {});
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  return (
    <div className="relative min-h-screen min-h-dvh w-full bg-bg text-fg grid lg:grid-cols-2 overflow-hidden">
      <div aria-hidden="true" className="rawin-atmosphere" />

      {/* Editorial panel */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-line overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -left-1/4 top-1/4 w-[120%] aspect-square rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--atmo-a), transparent 60%)" }}
        />
        <div className="relative flex items-center justify-between">
          <Wordmark withMark={false} />
          <span className="label-mono text-fg-subtle">Studio</span>
        </div>
        <div className="relative">
          <p className="label-mono text-accent mb-6">RAWIN Studio</p>
          <p className="display-lg text-fg">
            The workspace
            <br />
            <em className="italic text-accent">behind</em> RAWIN.
          </p>
          <p className="mt-8 text-[17px] text-fg-muted max-w-[40ch]">
            Content, projects, writing, and platform telemetry. Managed in one place.
          </p>
        </div>
        <p className="relative label-mono text-fg-subtle">Authorized Developer access only</p>
      </section>

      {/* Form. One screen on a phone: a compact top row, then the form centred in the height
          that remains (dynamic viewport units, so iOS Safari's toolbars are accounted for), with
          spacing that tightens on short screens. Safe-area insets keep the top row clear of the
          notch and rounded corners. A screen too short for all of it (or enlarged text) scrolls
          normally instead of clipping. */}
      <section className="relative flex flex-col min-h-screen min-h-dvh pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-10">
        <div className="flex items-center justify-between h-12 sm:h-14 shrink-0">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg" aria-label="Return to RAWIN public website">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="lg:hidden">
              <Wordmark size="sm" withMark={false} />
            </span>
            <span className="hidden lg:inline">Back to site</span>
          </Link>
          <div className="shrink-0 rounded-full border border-line">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-[clamp(0.75rem,4dvh,2.5rem)]">
          <div className="w-full max-w-[420px]">
            <p className="label-mono text-fg-muted">
              <span className="text-accent mr-3">00</span>Sign in
            </p>
            <h1 className="mt-2 sm:mt-4 font-display text-[clamp(2.25rem,min(10vw,7dvh),3.6rem)] leading-[0.95] tracking-[-0.025em] text-fg">
              Welcome <em className="italic text-accent">back.</em>
            </h1>
            <p className="mt-2 sm:mt-3 text-[15px] text-fg-muted">Private management console for RAWIN 3.0.</p>

            {state?.error && (
              <div role="alert" className="mt-5 sm:mt-8 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg flex gap-3">
                <span aria-hidden="true" className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* inputs use 16px text on phones: iOS Safari zooms the page in on focus below 16px,
                and the zoom crops the top row and forces scrolling */}
            <form action={formAction} className="mt-[clamp(1.25rem,3.5dvh,2rem)] flex flex-col gap-4 sm:gap-5">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label htmlFor="email" className="label-mono text-fg-subtle">
                  Admin email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="admin-input h-12 admin-input-touch"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label htmlFor="password" className="label-mono text-fg-subtle">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={reveal ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    aria-describedby={capsLock ? "caps-hint" : undefined}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    className="admin-input h-12 pr-14 admin-input-touch"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((v) => !v)}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-full text-fg-muted hover:text-fg"
                    aria-label={reveal ? "Hide password" : "Show password"}
                    aria-pressed={reveal}
                  >
                    {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p id="caps-hint" role="status" className="text-[12.5px] text-warning">
                    Caps Lock is on.
                  </p>
                )}
              </div>

              <button type="submit" disabled={isPending} className="btn btn-primary w-full mt-1 sm:mt-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

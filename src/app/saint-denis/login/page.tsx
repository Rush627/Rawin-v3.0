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
          <span className="label-mono text-fg-subtle">Private / Restricted</span>
        </div>
        <div className="relative">
          <p className="label-mono text-accent mb-6">RAWIN Studio</p>
          <p className="display-lg text-fg">
            The room
            <br />
            <em className="italic text-accent">behind</em> the site.
          </p>
          <p className="mt-8 text-[17px] text-fg-muted max-w-[40ch]">
            Content, projects, the journal and Orbit&apos;s knowledge: edited here, published everywhere.
          </p>
        </div>
        <p className="relative label-mono text-fg-subtle">Authorized access only</p>
      </section>

      {/* Form */}
      <section className="relative flex flex-col px-5 sm:px-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg" aria-label="Return to RAWIN public website">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="lg:hidden">
              <Wordmark size="sm" withMark={false} />
            </span>
            <span className="hidden lg:inline">Back to site</span>
          </Link>
          <div className="rounded-full border border-line">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <p className="label-mono text-fg-muted">
              <span className="text-accent mr-3">00</span>Sign in
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,3.6rem)] leading-[0.95] tracking-[-0.025em] text-fg">
              Welcome <em className="italic text-accent">back.</em>
            </h1>
            <p className="mt-3 text-[15px] text-fg-muted">Private management system for RAWIN 3.0.</p>

            {state?.error && (
              <div role="alert" className="mt-8 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg flex gap-3">
                <span aria-hidden="true" className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="mt-8 flex flex-col gap-5">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="flex flex-col gap-2">
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
                  className="admin-input h-12"
                />
              </div>

              <div className="flex flex-col gap-2">
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
                    className="admin-input h-12 pr-14"
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

              <button type="submit" disabled={isPending} className="btn btn-primary w-full mt-2">
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

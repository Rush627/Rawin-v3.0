"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { loginAction, type LoginActionState } from "../actions";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    {}
  );

  return (
    <div className="min-h-screen min-h-dvh w-full flex items-center justify-center px-4 py-12 bg-ink-black relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pacific-cyan/10 blur-[120px] pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-apricot-cream/5 blur-[100px] pointer-events-none -z-10"
      />

      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group transition-transform duration-300 hover:scale-105"
            aria-label="Return to RAWIN public website"
          >
            <div className="relative">
              <Image
                src="/images/logo.png"
                alt="RAWIN Logo"
                width={115}
                height={40}
                unoptimized
                className="h-8 w-auto object-contain"
              />
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan border border-pacific-cyan/20 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMIN LOGIN</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Private management system for RAWIN 3.0. Authorized access only.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl flex flex-col gap-6 backdrop-blur-xl bg-surface/70">
          {/* Error Message */}
          {state?.error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-400 text-xs sm:text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-mono uppercase tracking-wider text-muted font-medium"
              >
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@rawin.dev"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/60 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-mono uppercase tracking-wider text-muted font-medium"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/60 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all shadow-[0_0_25px_rgba(24,155,173,0.3)] cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

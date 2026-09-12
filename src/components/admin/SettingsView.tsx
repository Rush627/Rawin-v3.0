"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  Database,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  HardDrive,
  FileCheck,
} from "lucide-react";
import { changePasswordAction, type PasswordChangeState } from "@/app/admin/settings/actions";

interface SettingsViewProps {
  adminEmail: string;
  isDbConnected: boolean;
  dbName: string;
  isGridFsReady: boolean;
  sessionSecurity: {
    cookieName: string;
    httpOnly: boolean;
    sameSite: string;
    secure: boolean;
    maxAgeDays: number;
    hasSecret: boolean;
  };
  securityConfig: {
    hasSessionSecret: boolean;
    hasPasswordHash: boolean;
    nodeEnv: string;
  };
}

export default function SettingsView({
  adminEmail,
  isDbConnected,
  dbName,
  isGridFsReady,
  sessionSecurity,
  securityConfig,
}: SettingsViewProps) {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, formAction, isPending] = useActionState<PasswordChangeState | null, FormData>(
    changePasswordAction,
    null
  );

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Admin Password Change Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold font-space text-foreground">
                Password
              </h2>
              <p className="text-xs text-muted font-mono">
                {adminEmail}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>bcrypt 12-round</span>
          </span>
        </div>

        {state?.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{state.error}</div>
          </div>
        )}

        {state?.success && (
          <div className="flex flex-col gap-3 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{state.message}</span>
            </div>
            <p className="text-xs text-muted">
              Your previous session cookie has been cleared. Please log in with your updated credentials.
            </p>
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="mt-1 w-fit px-4 py-2 rounded-lg bg-pacific-cyan text-ink-black text-xs font-mono font-semibold hover:bg-pacific-cyan/90 transition-all cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {!state?.success && (
          <form action={formAction} className="flex flex-col gap-5 max-w-xl">
            {/* Current Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="currentPassword"
                className="text-xs font-mono font-medium text-muted uppercase tracking-wider"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your existing password"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="newPassword"
                className="text-xs font-mono font-medium text-muted uppercase tracking-wider"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-mono font-medium text-muted uppercase tracking-wider"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isPending ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Three Diagnostic Cards: Session, Database & GridFS, Security Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Session Security Card */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Session Security
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">Cookie Name</span>
              <span className="text-foreground">{sessionSecurity.cookieName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">HttpOnly</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">SameSite</span>
              <span className="text-foreground">{sessionSecurity.sameSite}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">Secure Flag</span>
              <span className="text-foreground">
                {sessionSecurity.secure ? "Production Enforced" : "Development Local"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Lifetime</span>
              <span className="text-foreground">{sessionSecurity.maxAgeDays} Days Rolling</span>
            </div>
          </div>
        </div>

        {/* Database & GridFS Card */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Database & Storage
            </span>
            <Database className="w-4 h-4 text-pacific-cyan" />
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">MongoDB Status</span>
              <span className={isDbConnected ? "text-emerald-400 flex items-center gap-1" : "text-amber-400"}>
                {isDbConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </>
                ) : (
                  "Disconnected"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">Database</span>
              <span className="text-foreground">{isDbConnected ? dbName : "fallback"}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">GridFS Bucket</span>
              <span className={isGridFsReady ? "text-emerald-400 flex items-center gap-1" : "text-amber-400"}>
                <HardDrive className="w-3 h-3" />
                site_assets
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Storage Driver</span>
              <span className="text-foreground">Native GridFS Streams</span>
            </div>
          </div>
        </div>

        {/* Security Configuration Card */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Security Configuration
            </span>
            <Server className="w-4 h-4 text-apricot-cream" />
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">SESSION_SECRET</span>
              <span className={securityConfig.hasSessionSecret ? "text-emerald-400" : "text-amber-400"}>
                {securityConfig.hasSessionSecret ? "Configured (256-bit)" : "Dev Temporary"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">ADMIN_PASSWORD_HASH</span>
              <span className={securityConfig.hasPasswordHash ? "text-emerald-400" : "text-amber-400"}>
                {securityConfig.hasPasswordHash ? "Configured (bcrypt)" : "MongoDB Stored"}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-muted">Security Headers</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Runtime Environment</span>
              <span className="text-foreground uppercase">{securityConfig.nodeEnv}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HTTP Security Headers Overview */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
          <Layers className="w-4 h-4 text-pacific-cyan" />
          <h3 className="text-sm font-bold font-space text-foreground">
            Enforced HTTP Security Headers
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-muted/60 text-[11px]">X-Content-Type-Options</span>
            <span className="text-emerald-400 font-semibold">nosniff</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-muted/60 text-[11px]">X-Frame-Options</span>
            <span className="text-emerald-400 font-semibold">DENY</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-muted/60 text-[11px]">Referrer-Policy</span>
            <span className="text-emerald-400 font-semibold">strict-origin-when-cross-origin</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-muted/60 text-[11px]">Permissions-Policy</span>
            <span className="text-emerald-400 font-semibold">restricted (camera, mic, geo)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

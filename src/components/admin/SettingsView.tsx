"use client";

import { useState, useActionState, useEffect, useRef } from "react";
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
  Globe,
  Power,
  Wrench,
  Clock,
  Loader2,
} from "lucide-react";
import NeoToggle from "@/components/NeoToggle";
import {
  changePasswordAction,
  saveAvailabilityAction,
  type PasswordChangeState,
} from "@/app/admin/settings/actions";
import type { MaintenanceContent } from "@/lib/site-content";

const DURATION_OPTIONS = [
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
  { label: "4 hr", minutes: 240 },
];

function formatAdminRemaining(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const target = new Date(endsAt).getTime();
  if (isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return "Expired (Site Live)";
  const totalSec = Math.floor(diff / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, "0")}m`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatEndsAt(endsAt: string | null): string {
  if (!endsAt) return "";
  const d = new Date(endsAt);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

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
  initialMaintenance: MaintenanceContent;
}

export default function SettingsView({
  adminEmail,
  isDbConnected,
  dbName,
  isGridFsReady,
  sessionSecurity,
  securityConfig,
  initialMaintenance,
}: SettingsViewProps) {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Availability mode: "offline" | "maintenance" | "off"
  const isExpired = Boolean(
    initialMaintenance.endsAt &&
      new Date(initialMaintenance.endsAt).getTime() <= Date.now()
  );
  const initialMode = initialMaintenance.enabled && !isExpired
    ? initialMaintenance.showMessage
      ? "maintenance"
      : "offline"
    : "off";

  const [availabilityMode, setAvailabilityMode] = useState<"offline" | "maintenance" | "off">(
    initialMode
  );
  const [mMessage, setMMessage] = useState(
    initialMaintenance.message || "We'll be back shortly."
  );
  const lastSavedMessageRef = useRef(initialMaintenance.message || "");
  const [endsAt, setEndsAt] = useState<string | null>(
    isExpired ? null : initialMaintenance.endsAt || null
  );
  const [durationIndex, setDurationIndex] = useState(1); // 15 min default
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminRemaining, setAdminRemaining] = useState<string | null>(() =>
    isExpired ? null : formatAdminRemaining(initialMaintenance.endsAt || null)
  );

  // Live countdown ticker in admin settings
  useEffect(() => {
    if (!endsAt) {
      setAdminRemaining(null);
      return;
    }
    const updateTicker = () => {
      const rem = formatAdminRemaining(endsAt);
      setAdminRemaining(rem);
      if (rem === "Expired (Site Live)") {
        setAvailabilityMode("off");
        setEndsAt(null);
      }
    };
    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const executeSave = async (
    newMode: "offline" | "maintenance" | "off",
    newDurationMinutes: number | null,
    newMessage: string
  ) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await saveAvailabilityAction({
        mode: newMode,
        durationMinutes: newMode === "maintenance" ? newDurationMinutes : null,
        message: newMessage,
      });

      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({ type: "success", text: res.message || "Availability settings updated" });
        if (res.maintenance) {
          setEndsAt(res.maintenance.endsAt || null);
        }
        lastSavedMessageRef.current = newMessage;
        setTimeout(() => setFeedback(null), 3500);

        // Notify other open public tabs in the same browser session instantly
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          try {
            const channel = new BroadcastChannel("rawin_availability_sync");
            channel.postMessage({ type: "AVAILABILITY_CHANGED" });
            channel.close();
          } catch {}
        }

        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to update availability settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOffline = (checked: boolean) => {
    const nextMode = checked ? "offline" : "off";
    setAvailabilityMode(nextMode);
    if (nextMode === "offline") {
      setEndsAt(null);
    }
    executeSave(nextMode, null, mMessage);
  };

  const handleToggleMaintenance = (checked: boolean) => {
    const nextMode = checked ? "maintenance" : "off";
    setAvailabilityMode(nextMode);
    const duration = nextMode === "maintenance" ? DURATION_OPTIONS[durationIndex].minutes : null;
    executeSave(nextMode, duration, mMessage);
  };

  const handleDurationChange = (newIdx: number) => {
    setDurationIndex(newIdx);
    if (availabilityMode === "maintenance") {
      executeSave("maintenance", DURATION_OPTIONS[newIdx].minutes, mMessage);
    }
  };

  const handleMessageBlur = () => {
    if (mMessage !== lastSavedMessageRef.current && availabilityMode === "maintenance") {
      executeSave(
        availabilityMode,
        DURATION_OPTIONS[durationIndex].minutes,
        mMessage
      );
    }
  };

  const handleResetToLive = () => {
    setAvailabilityMode("off");
    setEndsAt(null);
    executeSave("off", null, mMessage);
  };

  const [state, formAction, isPending] = useActionState<PasswordChangeState | null, FormData>(
    changePasswordAction,
    null
  );

  return (
    <div className="flex flex-col gap-10">
      {/* 0. Website Availability & Maintenance Controls */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-6">
        {/* Header + Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold font-space text-foreground">
              Website Availability
            </h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs text-pacific-cyan font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium ${
                availabilityMode === "offline"
                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  : availabilityMode === "maintenance"
                  ? "text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/25"
                  : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  availabilityMode === "offline"
                    ? "bg-amber-400"
                    : availabilityMode === "maintenance"
                    ? "bg-pacific-cyan animate-pulse"
                    : "bg-emerald-400 animate-pulse"
                }`}
              />
              <span>
                {availabilityMode === "offline"
                  ? "Site Offline"
                  : availabilityMode === "maintenance"
                  ? "Maintenance Active"
                  : "Site Live"}
              </span>
            </span>
          </div>
        </div>

        {/* Inline Feedback Toast */}
        {feedback && (
          <div
            className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-mono font-medium transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Two Toggle Rows: Site Offline and Maintenance Mode */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Site Offline */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Power className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold font-space text-foreground">
                Site Offline
              </span>
            </div>
            <div className="flex items-center justify-end">
              <NeoToggle
                checked={availabilityMode === "offline"}
                onChange={(checked) => handleToggleOffline(checked)}
                ariaLabel="Toggle site offline mode"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Row 2: Maintenance Mode */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold font-space text-foreground">
                Maintenance Mode
              </span>
            </div>
            <div className="flex items-center justify-end">
              <NeoToggle
                checked={availabilityMode === "maintenance"}
                onChange={(checked) => handleToggleMaintenance(checked)}
                ariaLabel="Toggle scheduled maintenance mode"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Maintenance Message & Duration Controls */}
        <div
          className={`grid gap-6 ${
            availabilityMode === "offline" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          }`}
        >
          {/* Maintenance Message */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="maintenance-message"
                className="text-xs font-mono font-medium text-muted uppercase tracking-wider"
              >
                Maintenance Message
              </label>
              <span className="text-[11px] font-mono text-muted/60">
                {mMessage.length} / 300
              </span>
            </div>
            <textarea
              id="maintenance-message"
              value={mMessage}
              onChange={(e) => setMMessage(e.target.value.slice(0, 300))}
              onBlur={handleMessageBlur}
              placeholder="e.g. We'll be back shortly."
              rows={4}
              className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-4 py-3 text-sm text-foreground placeholder:text-muted/40 font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all resize-none"
            />
          </div>

          {/* Maintenance Duration - Completely hidden when Site Offline is active */}
          {availabilityMode !== "offline" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pacific-cyan" />
                  Maintenance Duration
                </span>
                <span className="text-xs font-mono text-pacific-cyan font-semibold">
                  {DURATION_OPTIONS[durationIndex].label}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={DURATION_OPTIONS.length - 1}
                value={durationIndex}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                className="w-full accent-pacific-cyan cursor-pointer h-1.5 bg-white/[0.08] rounded-lg"
              />

              {/* Quick Preset Buttons (10 min, 15 min, 30 min, 1 hr, 2 hr, 4 hr) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DURATION_OPTIONS.map((opt, idx) => {
                  const isSelected = durationIndex === idx;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleDurationChange(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-pacific-cyan text-ink-black font-semibold shadow-[0_0_10px_rgba(24,155,173,0.4)]"
                          : "bg-white/[0.04] text-muted hover:text-foreground border border-white/[0.06]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Live Ends At & Remaining Display */}
              {availabilityMode === "maintenance" && endsAt && (
                <div className="mt-2 p-3.5 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">Ends at:</span>
                    <span className="text-foreground font-medium">
                      {formatEndsAt(endsAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">Remaining:</span>
                    <span className="text-pacific-cyan font-semibold">
                      {adminRemaining || "Calculating..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Centered Reset Button */}
        <div className="flex justify-center pt-2 pb-1">
          <button
            type="button"
            onClick={handleResetToLive}
            disabled={isSaving || availabilityMode === "off"}
            className={`inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold font-space tracking-wide transition-all cursor-pointer shadow-sm ${
              availabilityMode === "off"
                ? "bg-white/[0.03] text-muted/40 border border-white/[0.06] cursor-not-allowed"
                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.98]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Reset to Live Public Site</span>
          </button>
        </div>
      </div>

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

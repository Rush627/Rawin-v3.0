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
  ChevronDown,
  Sparkles,
  Play,
} from "lucide-react";
import NeoToggle from "@/components/NeoToggle";
import RawinSelect, { type RawinSelectOption } from "./RawinSelect";
import {
  changePasswordAction,
  saveAvailabilityAction,
  saveLaunchExperienceAction,
  type PasswordChangeState,
} from "@/app/saint-denis/settings/actions";
import type { MaintenanceContent, LaunchExperienceContent } from "@/lib/site-content";
import LaunchExperience from "@/components/launch/LaunchExperience";

const LAUNCH_ANIMATION_OPTIONS: RawinSelectOption[] = [
  { value: "signal-wake", label: "Signal Wake" },
];

const LAUNCH_DURATION_OPTIONS: RawinSelectOption[] = [
  { value: "10.0", label: "10.0s", badge: "Fast" },
  { value: "11.0", label: "11.0s" },
  { value: "12.0", label: "12.0s", badge: "Default" },
  { value: "13.0", label: "13.0s" },
  { value: "14.0", label: "14.0s", badge: "Cinematic" },
  { value: "15.0", label: "15.0s", badge: "Extended" },
];

const LAUNCH_FREQUENCY_OPTIONS: RawinSelectOption[] = [
  { value: "once", label: "Once per browser", badge: "Default" },
  { value: "session", label: "Every session" },
  { value: "visit", label: "Every visit" },
];

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
  initialLaunchExperience?: LaunchExperienceContent;
}

export default function SettingsView({
  adminEmail,
  isDbConnected,
  dbName,
  isGridFsReady,
  sessionSecurity,
  securityConfig,
  initialMaintenance,
  initialLaunchExperience,
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

  // Launch Experience state
  const [isLaunchEnabled, setIsLaunchEnabled] = useState(
    Boolean(initialLaunchExperience?.enabled)
  );
  const [launchPrimaryMessage, setLaunchPrimaryMessage] = useState(
    initialLaunchExperience?.primaryMessage || "RAWIN v3.0"
  );
  const [launchSecondaryMessage, setLaunchSecondaryMessage] = useState(
    initialLaunchExperience?.secondaryMessage || "A new iteration is live."
  );
  const [launchAnimation, setLaunchAnimation] = useState<"signal-wake">(
    "signal-wake"
  );
  const [launchDuration, setLaunchDuration] = useState<number>(
    initialLaunchExperience?.duration || 12.0
  );
  const [launchFrequency, setLaunchFrequency] = useState<"once" | "session" | "visit">(
    initialLaunchExperience?.showFrequency || "once"
  );
  const [launchStartDate, setLaunchStartDate] = useState(
    initialLaunchExperience?.startDate || ""
  );
  const [launchEndDate, setLaunchEndDate] = useState(
    initialLaunchExperience?.endDate || ""
  );
  const [launchVersion, setLaunchVersion] = useState(
    initialLaunchExperience?.launchVersion || "2026-v3-launch"
  );
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);
  const [launchFeedback, setLaunchFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showLaunchPreview, setShowLaunchPreview] = useState(false);

  useEffect(() => {
    if (!launchFeedback) return;
    const timer = setTimeout(() => setLaunchFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [launchFeedback]);

  const handleSaveLaunchExperience = async () => {
    setIsSavingLaunch(true);
    setLaunchFeedback(null);

    const res = await saveLaunchExperienceAction({
      enabled: isLaunchEnabled,
      primaryMessage: launchPrimaryMessage,
      secondaryMessage: launchSecondaryMessage,
      animation: launchAnimation,
      duration: launchDuration,
      showFrequency: launchFrequency,
      startDate: launchStartDate ? launchStartDate : null,
      endDate: launchEndDate ? launchEndDate : null,
      launchVersion: launchVersion,
    });

    setIsSavingLaunch(false);

    if (res.error) {
      setLaunchFeedback({ type: "error", text: res.error });
    } else {
      setLaunchFeedback({
        type: "success",
        text: res.message || "Launch Experience saved successfully.",
      });
    }
  };

  const previewLaunchConfig: LaunchExperienceContent = {
    enabled: true,
    primaryMessage: launchPrimaryMessage,
    secondaryMessage: launchSecondaryMessage,
    animation: launchAnimation,
    duration: launchDuration,
    showFrequency: launchFrequency,
    startDate: launchStartDate || null,
    endDate: launchEndDate || null,
    launchVersion: launchVersion,
  };

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

  // Smartphone Accordion States (Closed by default)
  const [isMobileAvailabilityOpen, setIsMobileAvailabilityOpen] = useState(false);
  const [isMobilePasswordOpen, setIsMobilePasswordOpen] = useState(false);

  // Auto-expand mobile accordion on validation or submission error/success
  useEffect(() => {
    if (state?.error || state?.success) {
      setIsMobilePasswordOpen(true);
    }
  }, [state]);

  useEffect(() => {
    if (feedback?.type === "error") {
      setIsMobileAvailabilityOpen(true);
    }
  }, [feedback]);

  return (
    <>
      {/* Desktop Presentation (sm and up) -- Preserved 100% intact */}
      <div className="hidden sm:flex flex-col gap-10">
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

        <div className="h-px bg-white/[0.08]" />

        {/* 3. Launch Experience (Directly below Maintenance Mode) */}
        <div className="flex flex-col gap-6 pt-2">
          {/* Section Header + Status Pill */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-space text-foreground">
                  Launch Experience
                </h3>
                <p className="text-xs text-muted font-mono">
                  Temporary intro sequence before the public homepage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSavingLaunch && (
                <span className="flex items-center gap-1.5 text-xs text-pacific-cyan font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium ${
                  isLaunchEnabled
                    ? "text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/25"
                    : "text-muted/60 bg-white/[0.04] border border-white/[0.08]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLaunchEnabled ? "bg-pacific-cyan animate-pulse" : "bg-muted/40"
                  }`}
                />
                <span>{isLaunchEnabled ? "LAUNCH ACTIVE" : "DISABLED"}</span>
              </span>
            </div>
          </div>

          {/* Inline Feedback Toast */}
          {launchFeedback && (
            <div
              className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-mono font-medium transition-all ${
                launchFeedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {launchFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{launchFeedback.text}</span>
            </div>
          )}

          {/* Master Enable Row */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                <Play className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold font-space text-foreground">
                  Enable Launch Experience
                </span>
                <span className="text-xs text-muted/60 font-mono">
                  Master switch governing public entry sequence
                </span>
              </div>
            </div>
            <NeoToggle
              checked={isLaunchEnabled}
              onChange={(checked) => setIsLaunchEnabled(checked)}
              ariaLabel="Enable or disable launch experience"
              disabled={isSavingLaunch}
            />
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Message */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                Launch Message (Primary)
              </label>
              <input
                type="text"
                value={launchPrimaryMessage}
                onChange={(e) => setLaunchPrimaryMessage(e.target.value.slice(0, 100))}
                placeholder="RAWIN v3.0"
                className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all"
              />
            </div>

            {/* Secondary Message */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                Secondary Message
              </label>
              <input
                type="text"
                value={launchSecondaryMessage}
                onChange={(e) => setLaunchSecondaryMessage(e.target.value.slice(0, 200))}
                placeholder="A new iteration is live."
                className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all"
              />
            </div>

            {/* Animation & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                  Animation
                </label>
                <RawinSelect
                  id="launch-animation"
                  name="launchAnimation"
                  value={launchAnimation}
                  onChange={(val) => setLaunchAnimation(val as "signal-wake")}
                  options={LAUNCH_ANIMATION_OPTIONS}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                  Duration
                </label>
                <RawinSelect
                  id="launch-duration"
                  name="launchDuration"
                  value={Number.isFinite(launchDuration) ? launchDuration.toFixed(1) : "12.0"}
                  onChange={(val) => setLaunchDuration(parseFloat(val))}
                  options={LAUNCH_DURATION_OPTIONS}
                />
              </div>
            </div>

            {/* Show Frequency */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                Show Frequency
              </label>
              <RawinSelect
                id="launch-frequency"
                name="launchFrequency"
                value={launchFrequency}
                onChange={(val) => setLaunchFrequency(val as "once" | "session" | "visit")}
                options={LAUNCH_FREQUENCY_OPTIONS}
              />
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={launchStartDate}
                  onChange={(e) => setLaunchStartDate(e.target.value)}
                  className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-sm text-foreground font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={launchEndDate}
                  onChange={(e) => setLaunchEndDate(e.target.value)}
                  className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-sm text-foreground font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all"
                />
              </div>
            </div>

            {/* Launch Version */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                  Launch Version
                </label>
                <span className="text-[11px] font-mono text-muted/60">
                  Resets visitor seen state
                </span>
              </div>
              <input
                type="text"
                value={launchVersion}
                onChange={(e) => setLaunchVersion(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                placeholder="2026-v3-launch"
                className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 font-mono focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all"
              />
            </div>
          </div>

          {/* Action Row: Preview & Save */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowLaunchPreview(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-pacific-cyan" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleSaveLaunchExperience}
              disabled={isSavingLaunch}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-space font-semibold tracking-wide bg-pacific-cyan hover:bg-pacific-cyan/90 text-ink-black transition-all cursor-pointer shadow-[0_0_20px_rgba(24,155,173,0.3)] disabled:opacity-50"
            >
              {isSavingLaunch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Launch Experience</span>
                </>
              )}
            </button>
          </div>
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
              onClick={() => router.push("/saint-denis/login")}
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

      {/* Smartphone Presentation (< sm) -- Purpose-built, compact, premium control panel */}
      <div className="flex sm:hidden flex-col gap-3.5">
        {/* 1. Website Availability Accordion */}
        <div
          className={`glass-card rounded-xl border border-white/[0.08] transition-colors hover:border-white/[0.12] ${
            isMobileAvailabilityOpen ? "overflow-visible" : "overflow-hidden"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsMobileAvailabilityOpen(!isMobileAvailabilityOpen)}
            aria-expanded={isMobileAvailabilityOpen}
            aria-controls="mobile-availability-panel"
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Website Availability
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      availabilityMode === "offline"
                        ? "bg-amber-400"
                        : availabilityMode === "maintenance"
                        ? "bg-pacific-cyan animate-pulse"
                        : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      availabilityMode === "offline"
                        ? "text-amber-400"
                        : availabilityMode === "maintenance"
                        ? "text-pacific-cyan"
                        : "text-emerald-400"
                    }`}
                  >
                    {availabilityMode === "offline"
                      ? "Site Offline"
                      : availabilityMode === "maintenance"
                      ? "Maintenance Active"
                      : "Site Live"}
                  </span>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-[10px] text-pacific-cyan font-mono ml-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  isMobileAvailabilityOpen ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          {/* Expanded Availability Content */}
          <div
            id="mobile-availability-panel"
            role="region"
            aria-label="Website Availability Controls"
            className={isMobileAvailabilityOpen ? "p-4 pt-2 border-t border-white/[0.06] flex flex-col gap-3.5 w-full min-w-0 max-w-full box-border" : "hidden"}
          >
            {/* Inline Feedback Toast */}
            {feedback && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-mono font-medium transition-all ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="break-words">{feedback.text}</span>
              </div>
            )}

            {/* Toggle Rows */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Site Offline */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Power className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold font-space text-foreground truncate">
                      Site Offline
                    </span>
                    <span className="text-[10px] font-mono text-muted/60">
                      Takes site offline
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={availabilityMode === "offline"}
                    aria-label="Toggle site offline mode"
                    disabled={isSaving}
                    onClick={() => handleToggleOffline(availabilityMode !== "offline")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:opacity-50 ${
                      availabilityMode === "offline"
                        ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                        : "bg-white/[0.12]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ink-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                        availabilityMode === "offline" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[9px] font-mono font-semibold tracking-wider ${
                      availabilityMode === "offline" ? "text-amber-400" : "text-muted/50"
                    }`}
                  >
                    {availabilityMode === "offline" ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Row 2: Maintenance Mode */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold font-space text-foreground truncate">
                      Maintenance Mode
                    </span>
                    <span className="text-[10px] font-mono text-muted/60">
                      Shows maintenance notice
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={availabilityMode === "maintenance"}
                    aria-label="Toggle scheduled maintenance mode"
                    disabled={isSaving}
                    onClick={() => handleToggleMaintenance(availabilityMode !== "maintenance")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/50 disabled:opacity-50 ${
                      availabilityMode === "maintenance"
                        ? "bg-pacific-cyan shadow-[0_0_12px_rgba(24,155,173,0.35)]"
                        : "bg-white/[0.12]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ink-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                        availabilityMode === "maintenance" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[9px] font-mono font-semibold tracking-wider ${
                      availabilityMode === "maintenance" ? "text-pacific-cyan" : "text-muted/50"
                    }`}
                  >
                    {availabilityMode === "maintenance" ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Message */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="mobile-maintenance-message"
                  className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider"
                >
                  Maintenance Message
                </label>
                <span className="text-[10px] font-mono text-muted/60">
                  {mMessage.length} / 300
                </span>
              </div>
              <textarea
                id="mobile-maintenance-message"
                value={mMessage}
                onChange={(e) => setMMessage(e.target.value.slice(0, 300))}
                onBlur={handleMessageBlur}
                placeholder="e.g. We'll be back shortly."
                rows={3}
                className="w-full rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/40 font-mono focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-all resize-none"
              />
            </div>

            {/* Maintenance Duration (Hidden when offline) */}
            {availabilityMode !== "offline" && (
              <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-pacific-cyan" />
                    Duration
                  </span>
                  <span className="text-xs font-mono text-pacific-cyan font-semibold">
                    {DURATION_OPTIONS[durationIndex].label}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={DURATION_OPTIONS.length - 1}
                  value={durationIndex}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                  className="w-full accent-pacific-cyan cursor-pointer h-1.5 bg-white/[0.08] rounded-lg"
                />

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {DURATION_OPTIONS.map((opt, idx) => {
                    const isSelected = durationIndex === idx;
                    return (
                      <button
                        key={`m-opt-${opt.label}`}
                        type="button"
                        onClick={() => handleDurationChange(idx)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono transition-all text-center cursor-pointer ${
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

                {/* Live Countdown Info */}
                {availabilityMode === "maintenance" && endsAt && (
                  <div className="mt-1 p-2.5 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/20 flex flex-col gap-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-[10px]">Ends at:</span>
                      <span className="text-foreground font-medium text-[10px]">
                        {formatEndsAt(endsAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-[10px]">Remaining:</span>
                      <span className="text-pacific-cyan font-semibold text-[10px]">
                        {adminRemaining || "Calculating..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reset to Live Button */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleResetToLive}
                disabled={isSaving || availabilityMode === "off"}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all flex items-center justify-center gap-2 min-h-[38px] ${
                  availabilityMode === "off"
                    ? "bg-white/[0.03] text-muted/40 border border-white/[0.06] cursor-not-allowed"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset to Live Public Site</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] my-1" />

            {/* 3. Purpose-Built Smartphone Launch Experience */}
            <div className="flex flex-col gap-3.5 pt-1 w-full min-w-0 max-w-full box-border">
              {/* Header: Compact, Technical, Controlled */}
              <div className="flex items-center justify-between gap-2.5 w-full min-w-0 max-w-full box-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold font-space text-foreground truncate">
                      Launch Experience
                    </span>
                    <span className="text-[10px] font-mono text-muted/60 truncate">
                      Public entry sequence
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 tracking-wider ${
                    isLaunchEnabled
                      ? "text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/25"
                      : "text-muted/60 bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  {isLaunchEnabled ? "ACTIVE" : "STANDBY"}
                </span>
              </div>

              {/* Mobile Launch Feedback Banner */}
              {launchFeedback && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-mono font-medium transition-all w-full min-w-0 max-w-full box-border ${
                    launchFeedback.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {launchFeedback.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="break-words min-w-0 flex-1">{launchFeedback.text}</span>
                </div>
              )}

              {/* Dedicated Mobile Enable Control Card */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] w-full min-w-0 max-w-full box-border">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold font-space text-foreground truncate">
                    Enable
                  </span>
                  <span className="text-[10px] font-mono text-muted/60 truncate">
                    Toggle launch screen
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isLaunchEnabled}
                  aria-label="Toggle launch screen"
                  disabled={isSavingLaunch}
                  onClick={() => setIsLaunchEnabled(!isLaunchEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/50 disabled:opacity-50 ${
                    isLaunchEnabled
                      ? "bg-pacific-cyan shadow-[0_0_12px_rgba(24,155,173,0.35)]"
                      : "bg-white/[0.12]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ink-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isLaunchEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Dedicated Full-Width Single Column Form Controls */}
              <div className="flex flex-col gap-3 w-full min-w-0 max-w-full box-border">
                {/* 1. Launch Message */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Launch Message
                  </label>
                  <input
                    type="text"
                    value={launchPrimaryMessage}
                    onChange={(e) => setLaunchPrimaryMessage(e.target.value.slice(0, 100))}
                    placeholder="RAWIN v3.0"
                    className="w-full min-w-0 max-w-full box-border rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/40 font-mono min-h-[40px] focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-colors"
                  />
                </div>

                {/* 2. Secondary Message */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Secondary Message
                  </label>
                  <textarea
                    rows={2}
                    value={launchSecondaryMessage}
                    onChange={(e) => setLaunchSecondaryMessage(e.target.value.slice(0, 200))}
                    placeholder="A new iteration is live."
                    className="w-full min-w-0 max-w-full box-border rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/40 font-sans focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 resize-none min-h-[56px] transition-colors"
                  />
                </div>

                {/* 3. Animation (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Animation
                  </label>
                  <RawinSelect
                    id="mobile-launch-animation"
                    name="mobileLaunchAnimation"
                    value={launchAnimation}
                    onChange={(val) => setLaunchAnimation(val as "signal-wake")}
                    options={LAUNCH_ANIMATION_OPTIONS}
                    className="w-full min-w-0 max-w-full"
                  />
                </div>

                {/* 4. Duration (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Duration
                  </label>
                  <RawinSelect
                    id="mobile-launch-duration"
                    name="mobileLaunchDuration"
                    value={Number.isFinite(launchDuration) ? launchDuration.toFixed(1) : "12.0"}
                    onChange={(val) => setLaunchDuration(parseFloat(val))}
                    options={LAUNCH_DURATION_OPTIONS}
                    className="w-full min-w-0 max-w-full"
                  />
                </div>

                {/* 5. Show Frequency (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Show Frequency
                  </label>
                  <RawinSelect
                    id="mobile-launch-frequency"
                    name="mobileLaunchFrequency"
                    value={launchFrequency}
                    onChange={(val) => setLaunchFrequency(val as "once" | "session" | "visit")}
                    options={LAUNCH_FREQUENCY_OPTIONS}
                    className="w-full min-w-0 max-w-full"
                  />
                </div>

                {/* 6. Start Date (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={launchStartDate}
                    onChange={(e) => setLaunchStartDate(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border appearance-none [-webkit-appearance:none] rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground font-mono min-h-[40px] focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 [color-scheme:dark] transition-colors"
                  />
                </div>

                {/* 7. End Date (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={launchEndDate}
                    onChange={(e) => setLaunchEndDate(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border appearance-none [-webkit-appearance:none] rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground font-mono min-h-[40px] focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 [color-scheme:dark] transition-colors"
                  />
                </div>

                {/* 8. Launch Version (Dedicated full-width row) */}
                <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full box-border">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                    Launch Version
                  </label>
                  <input
                    type="text"
                    value={launchVersion}
                    onChange={(e) => setLaunchVersion(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                    placeholder="2026-v3-launch"
                    className="w-full min-w-0 max-w-full box-border rounded-xl bg-ink-black/60 border border-white/[0.1] px-3.5 py-2.5 text-xs text-foreground font-mono min-h-[40px] focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 transition-colors"
                  />
                </div>

                {/* Dedicated Mobile Action Buttons (Stacked Vertically) */}
                <div className="flex flex-col gap-2.5 pt-1.5 w-full min-w-0 max-w-full box-border">
                  {/* Preview Animation (Secondary) */}
                  <button
                    type="button"
                    onClick={() => setShowLaunchPreview(true)}
                    className="w-full min-w-0 max-w-full box-border py-2.5 px-4 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center gap-2 min-h-[42px] cursor-pointer transition-colors active:scale-[0.99]"
                  >
                    <Play className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                    <span className="truncate">Preview Animation</span>
                  </button>

                  {/* Save Launch Changes (Primary) */}
                  <button
                    type="button"
                    onClick={handleSaveLaunchExperience}
                    disabled={isSavingLaunch}
                    className="w-full min-w-0 max-w-full box-border py-2.5 px-4 rounded-xl text-xs font-space font-semibold tracking-wide bg-pacific-cyan text-ink-black flex items-center justify-center gap-2 min-h-[42px] cursor-pointer shadow-[0_0_15px_rgba(24,155,173,0.3)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all"
                  >
                    {isSavingLaunch ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span className="truncate">Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Save Launch Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Password Accordion */}
        <div className="glass-card rounded-xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => setIsMobilePasswordOpen(!isMobilePasswordOpen)}
            aria-expanded={isMobilePasswordOpen}
            aria-controls="mobile-password-panel"
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Password
                </span>
                <span className="text-[10px] font-mono text-muted/60 truncate max-w-[200px]">
                  {adminEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  isMobilePasswordOpen ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          {/* Expanded Password Content */}
          <div
            id="mobile-password-panel"
            role="region"
            aria-label="Admin Password Controls"
            className={isMobilePasswordOpen ? "p-4 pt-2 border-t border-white/[0.06] flex flex-col gap-3.5" : "hidden"}
          >
            {state?.error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 break-words">{state.error}</div>
              </div>
            )}

            {state?.success && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{state.message}</span>
                </div>
                <p className="text-[11px] text-muted">
                  Session cookie cleared. Please log in with updated credentials.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/saint-denis/login")}
                  className="mt-1 w-full py-2 rounded-lg bg-pacific-cyan text-ink-black text-xs font-mono font-semibold hover:bg-pacific-cyan/90 transition-all cursor-pointer text-center"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}

            {!state?.success && (
              <form action={formAction} className="flex flex-col gap-3.5">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="mobile-currentPassword"
                    className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-currentPassword"
                      name="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Enter existing password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10 min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="mobile-newPassword"
                    className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-newPassword"
                      name="newPassword"
                      type={showNew ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10 min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="mobile-confirmPassword"
                    className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan/50 focus:ring-1 focus:ring-pacific-cyan/50 font-mono transition-all pr-10 min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] disabled:opacity-50 cursor-pointer min-h-[38px]"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isPending ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3. Session Security (Compact Info Card) */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                Session Security
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Encrypted
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">Cookie Name</span>
              <span className="text-foreground text-[11px] font-medium break-all">{sessionSecurity.cookieName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">HttpOnly</span>
              <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">SameSite</span>
              <span className="text-foreground text-[11px]">{sessionSecurity.sameSite}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">Secure Flag</span>
              <span className="text-foreground text-[11px] text-right">
                {sessionSecurity.secure ? "Production Enforced" : "Development Local"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted text-[11px]">Lifetime</span>
              <span className="text-foreground text-[11px]">{sessionSecurity.maxAgeDays} Days Rolling</span>
            </div>
          </div>
        </div>

        {/* 4. Database & Storage (Compact Info Card) */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-pacific-cyan" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                Database & Storage
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isDbConnected
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-amber-400 bg-amber-500/10 border-amber-500/20"
            }`}>
              {isDbConnected ? "Operational" : "Offline"}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">MongoDB Status</span>
              <span className={`text-[11px] font-medium flex items-center gap-1 ${
                isDbConnected ? "text-emerald-400" : "text-amber-400"
              }`}>
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
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">Database</span>
              <span className="text-foreground text-[11px]">{isDbConnected ? dbName : "fallback"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">GridFS Bucket</span>
              <span className={`text-[11px] flex items-center gap-1 ${
                isGridFsReady ? "text-emerald-400" : "text-amber-400"
              }`}>
                <HardDrive className="w-3 h-3" />
                site_assets
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted text-[11px]">Storage Driver</span>
              <span className="text-foreground text-[11px] text-right">Native GridFS Streams</span>
            </div>
          </div>
        </div>

        {/* 5. Security Configuration (Compact Info Card) */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-apricot-cream" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                Security Configuration
              </span>
            </div>
            <span className="text-[10px] font-mono text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded-full uppercase">
              {securityConfig.nodeEnv}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">SESSION_SECRET</span>
              <span className={`text-[11px] font-medium ${
                securityConfig.hasSessionSecret ? "text-emerald-400" : "text-amber-400"
              }`}>
                {securityConfig.hasSessionSecret ? "Configured (256-bit)" : "Dev Temporary"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">ADMIN_PASSWORD_HASH</span>
              <span className={`text-[11px] font-medium ${
                securityConfig.hasPasswordHash ? "text-emerald-400" : "text-amber-400"
              }`}>
                {securityConfig.hasPasswordHash ? "Configured (bcrypt)" : "MongoDB Stored"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted text-[11px]">Security Headers</span>
              <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                <FileCheck className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted text-[11px]">Runtime Environment</span>
              <span className="text-foreground text-[11px] uppercase">{securityConfig.nodeEnv}</span>
            </div>
          </div>
        </div>

        {/* 6. Enforced HTTP Security Headers (Compact Info Card) */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
            <Layers className="w-4 h-4 text-pacific-cyan" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
              Enforced HTTP Security Headers
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.04]">
              <span className="text-muted/60 text-[10px] uppercase tracking-wider">X-Content-Type-Options</span>
              <span className="text-emerald-400 font-semibold text-xs">nosniff</span>
            </div>
            <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.04]">
              <span className="text-muted/60 text-[10px] uppercase tracking-wider">X-Frame-Options</span>
              <span className="text-emerald-400 font-semibold text-xs">DENY</span>
            </div>
            <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.04]">
              <span className="text-muted/60 text-[10px] uppercase tracking-wider">Referrer-Policy</span>
              <span className="text-emerald-400 font-semibold text-xs break-all">strict-origin-when-cross-origin</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted/60 text-[10px] uppercase tracking-wider">Permissions-Policy</span>
              <span className="text-emerald-400 font-semibold text-xs break-all">restricted (camera, mic, geo)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Admin Preview Modal */}
      {showLaunchPreview && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#101019]">
          <LaunchExperience
            launch={previewLaunchConfig}
            isPreview={true}
            onComplete={() => setShowLaunchPreview(false)}
          />
          <button
            type="button"
            onClick={() => setShowLaunchPreview(false)}
            className="fixed top-5 right-5 z-[10001] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-mono text-xs border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
          >
            <span>Close Preview</span>
            <span className="text-white/60">[Esc]</span>
          </button>
        </div>
      )}
    </>
  );
}

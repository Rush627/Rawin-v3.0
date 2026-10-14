"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogOut, Play } from "lucide-react";
import { Button, FieldGrid, Group, Segmented, SelectField, Slider, StatusLine, Switch, TextField } from "./fields";
import CardSave from "./CardSave";
import ConfirmDialog from "./ConfirmDialog";
import { useSectionEditor } from "./useSectionEditor";
import { useUnsavedChanges } from "./UnsavedChanges";
import { AVAILABILITY_TONE, type AvailabilityContent } from "@/lib/cms/availability";
import type { LaunchExperienceContent, MaintenanceContent } from "@/lib/site-content";
import { changePasswordAction, saveAvailabilityAction, saveLaunchExperienceAction, type PasswordChangeState } from "@/app/saint-denis/settings/actions";
import { signOutEverywhereAction } from "@/app/saint-denis/actions";
import LaunchExperience from "@/components/launch/LaunchExperience";

const TONE_CLASS = { green: "text-success", orange: "text-warning", red: "text-danger" } as const;

/* ------------------------------------------------------------------ availability */

export function AvailabilityCard({ initial }: { initial: AvailabilityContent }) {
  const ed = useSectionEditor("availability", { ...initial });
  const v = ed.values;
  return (
    <Group title="Availability" description="One status for the hero, footer, contact page, resume and Orbit.">
      <Segmented
        label="Status"
        value={v.state}
        onChange={(x) => ed.set("state", x)}
        options={[
          { value: "available", label: "Available", tone: TONE_CLASS[AVAILABILITY_TONE.available] },
          { value: "limited", label: "Limited", tone: TONE_CLASS[AVAILABILITY_TONE.limited] },
          { value: "unavailable", label: "Unavailable", tone: TONE_CLASS[AVAILABILITY_TONE.unavailable] },
        ]}
      />
      <FieldGrid>
        <TextField label="Status label" value={v.label} onChange={(x) => ed.set("label", x)} maxLength={60} error={ed.errors.label} hint="Hero, resume and Orbit, e.g. “Open to opportunities”." />
        <TextField label="Supporting line" value={v.note} onChange={(x) => ed.set("note", x)} maxLength={100} error={ed.errors.note} hint="Hero badge, footer and contact page." />
      </FieldGrid>
      <CardSave state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} />
    </Group>
  );
}

/* ------------------------------------------------------------------ theme defaults */

export function ThemeDefaultsCard({ initial }: { initial: { themeDefaultDesktop: "light" | "dark"; themeDefaultMobile: "light" | "dark" } }) {
  const ed = useSectionEditor("global", { ...initial });
  const options = [
    { value: "light" as const, label: "Light" },
    { value: "dark" as const, label: "Dark" },
  ];
  return (
    <Group title="Theme defaults" description="For visitors who have not chosen a theme themselves (their choice always wins)." defaultOpen={false}>
      <FieldGrid>
        <Segmented label="Desktop and tablet" value={ed.values.themeDefaultDesktop} onChange={(x) => ed.set("themeDefaultDesktop", x)} options={options} />
        <Segmented label="Smartphone (under 768 px)" value={ed.values.themeDefaultMobile} onChange={(x) => ed.set("themeDefaultMobile", x)} options={options} />
      </FieldGrid>
      <CardSave state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} />
    </Group>
  );
}

/* ------------------------------------------------------------------ site mode (maintenance / offline) */

const DURATIONS = [5, 15, 30, 60, 120, 240, 480, 1440];
const durationLabel = (m: number) => (m < 60 ? `${m} min` : m < 1440 ? `${m / 60} h` : "24 h");

export function SiteModeCard({ initial }: { initial: MaintenanceContent & { active: boolean } }) {
  const router = useRouter();
  const current: "off" | "maintenance" | "offline" = !initial.active ? "off" : initial.showMessage ? "maintenance" : "offline";
  const [mode, setMode] = useState(current);
  const [durationIdx, setDurationIdx] = useState(1);
  const [message, setMessage] = useState(initial.message || "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const { setDirty } = useUnsavedChanges();
  const dirty = mode !== current || (mode === "maintenance" && message !== (initial.message || ""));
  useEffect(() => {
    setDirty("site-mode", dirty);
    return () => setDirty("site-mode", false);
  }, [dirty, setDirty]);

  const apply = async () => {
    setBusy(true);
    setNote(null);
    const res = await saveAvailabilityAction({ mode, durationMinutes: mode === "maintenance" ? DURATIONS[durationIdx] : null, message }).catch(() => ({ error: "The server could not be reached." }) as { error?: string; message?: string; success?: boolean });
    setBusy(false);
    setConfirm(false);
    if (res.success) {
      setNote({ tone: "ok", text: res.message || "Updated." });
      router.refresh();
    } else setNote({ tone: "error", text: res.error || "Not updated." });
  };

  const endsAt = initial.endsAt ? new Date(initial.endsAt) : null;
  return (
    <Group title="Site mode" description="Whether visitors see the site. You stay signed in and can still browse it.">
      <p className="text-[14px]">
        <StatusLine tone={current === "off" ? "ok" : "warn"}>
          {current === "off"
            ? "Live: the site is public."
            : current === "maintenance"
              ? `Maintenance${endsAt ? ` until ${endsAt.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}` : ""}: visitors see the maintenance page (HTTP 503).`
              : "Offline: visitors see the offline page (HTTP 503) until you switch back."}
        </StatusLine>
      </p>
      <Segmented
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "off", label: "Live" },
          { value: "maintenance", label: "Maintenance" },
          { value: "offline", label: "Offline" },
        ]}
      />
      {mode === "maintenance" && (
        <>
          <Slider label="Duration" min={0} max={DURATIONS.length - 1} step={1} value={durationIdx} onChange={setDurationIdx} format={(i) => durationLabel(DURATIONS[i])} />
          <TextField label="Message for visitors" value={message} onChange={setMessage} maxLength={300} multiline rows={2} />
        </>
      )}
      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
          {note.text}
        </p>
      )}
      <div className="flex justify-end pt-2 border-t border-line">
        <Button tone="primary" disabled={!dirty} busy={busy} onClick={() => (mode === "off" ? apply() : setConfirm(true))}>
          {mode === "off" ? "Go live" : mode === "maintenance" ? "Start maintenance" : "Take site offline"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        title={mode === "maintenance" ? "Start maintenance?" : "Take the site offline?"}
        confirmLabel={mode === "maintenance" ? "Start maintenance" : "Take offline"}
        destructive
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={apply}
      >
        {mode === "maintenance"
          ? `Every public page will show the maintenance message for ${durationLabel(DURATIONS[durationIdx])}, then the site goes live again by itself.`
          : "Every public page will show the offline page until you switch back to Live."}
      </ConfirmDialog>
    </Group>
  );
}

/* ------------------------------------------------------------------ launch experience */

export function LaunchCard({ initial }: { initial: LaunchExperienceContent }) {
  const [v, setV] = useState(initial);
  const [base, setBase] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const { setDirty } = useUnsavedChanges();
  const dirty = JSON.stringify(v) !== JSON.stringify(base);
  useEffect(() => {
    setDirty("launch", dirty);
    return () => setDirty("launch", false);
  }, [dirty, setDirty]);
  const set = <K extends keyof LaunchExperienceContent>(k: K, x: LaunchExperienceContent[K]) => setV((o) => ({ ...o, [k]: x }));

  const save = async () => {
    setBusy(true);
    setNote(null);
    const res = await saveLaunchExperienceAction(v).catch(() => ({ error: "The server could not be reached." }) as { error?: string; success?: boolean; launchExperience?: LaunchExperienceContent });
    setBusy(false);
    if (res.success) {
      const saved = res.launchExperience ?? v;
      setV(saved);
      setBase(saved);
      setNote({ tone: "ok", text: "Saved." });
    } else setNote({ tone: "error", text: res.error || "Not saved." });
  };

  return (
    <Group title="Launch experience" description="A one-time intro animation on the homepage for a release." defaultOpen={false}>
      <Switch label="Show the launch intro" checked={v.enabled} onChange={(x) => set("enabled", x)} />
      <FieldGrid>
        <TextField label="Headline" value={v.primaryMessage} onChange={(x) => set("primaryMessage", x)} maxLength={100} />
        <TextField label="Second line" value={v.secondaryMessage} onChange={(x) => set("secondaryMessage", x)} maxLength={200} />
      </FieldGrid>
      <FieldGrid>
        <Slider label="Length" min={5} max={20} step={0.5} value={v.duration} onChange={(x) => set("duration", x)} format={(x) => `${x.toFixed(1)} s`} />
        <SelectField
          label="Show it"
          value={v.showFrequency}
          onChange={(x) => set("showFrequency", x)}
          options={[
            { value: "once", label: "Once per visitor" },
            { value: "session", label: "Once per browser session" },
            { value: "visit", label: "On every visit" },
          ]}
        />
      </FieldGrid>
      <FieldGrid cols={3}>
        <TextField label="From" type="date" value={v.startDate ?? ""} onChange={(x) => set("startDate", x || null)} />
        <TextField label="Until" type="date" value={v.endDate ?? ""} onChange={(x) => set("endDate", x || null)} />
        <TextField label="Release id" value={v.launchVersion} onChange={(x) => set("launchVersion", x)} maxLength={60} hint="Change it to show the intro again to returning visitors." />
      </FieldGrid>
      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
          {note.text}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        <Button tone="ghost" onClick={() => setPreview(true)}>
          <Play aria-hidden="true" className="w-4 h-4" />
          Preview
        </Button>
        {dirty && (
          <Button tone="ghost" onClick={() => setV(base)}>
            Discard
          </Button>
        )}
        <Button tone="primary" disabled={!dirty} busy={busy} onClick={save}>
          Save
        </Button>
      </div>
      {preview && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-surface">
          <LaunchExperience launch={v} isPreview onComplete={() => setPreview(false)} />
        </div>
      )}
    </Group>
  );
}

/* ------------------------------------------------------------------ account */

export function AccountCard({ email }: { email: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PasswordChangeState | null, FormData>(changePasswordAction, null);
  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.requiresLogin) {
      const t = setTimeout(() => router.push("/saint-denis/login"), 2500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const signOutAll = async () => {
    setBusy(true);
    const res = await signOutEverywhereAction().catch(() => ({ error: "The server could not be reached." }));
    // on success the action redirects to the sign-in page
    setBusy(false);
    setConfirm(false);
    if (res?.error) setError(res.error);
  };

  return (
    <Group title="Account & sessions" description={email} defaultOpen={false}>
      <form action={formAction} className="flex flex-col gap-4 max-w-xl">
        <input type="hidden" name="username" value={email} autoComplete="username" readOnly />
        <PasswordInput name="currentPassword" label="Current password" autoComplete="current-password" show={show} />
        <FieldGrid>
          <PasswordInput name="newPassword" label="New password" autoComplete="new-password" show={show} hint="At least 8 characters." />
          <PasswordInput name="confirmPassword" label="Repeat new password" autoComplete="new-password" show={show} />
        </FieldGrid>
        <button type="button" onClick={() => setShow((s) => !s)} className="self-start inline-flex items-center gap-2 min-h-11 text-[13.5px] text-fg-muted hover:text-fg" aria-pressed={show}>
          {show ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
          {show ? "Hide passwords" : "Show passwords"}
        </button>
        {state?.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" className="text-[13px] text-success">
            {state.message}
          </p>
        )}
        <div className="flex justify-end pt-2 border-t border-line">
          <Button type="submit" tone="primary" busy={pending}>
            Change password
          </Button>
        </div>
      </form>
      <div className="mt-2 pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-[13.5px] text-fg-muted">Lost a device? Sign out every session for this account, including this one.</p>
        <Button tone="secondary" onClick={() => setConfirm(true)}>
          <LogOut aria-hidden="true" className="w-4 h-4" />
          Sign out everywhere
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog open={confirm} title="Sign out everywhere?" confirmLabel="Sign out all sessions" destructive busy={busy} onCancel={() => setConfirm(false)} onConfirm={signOutAll}>
        Every browser signed in to the studio, including this one, will need to sign in again.
      </ConfirmDialog>
    </Group>
  );
}

function PasswordInput({ name, label, autoComplete, show, hint }: { name: string; label: string; autoComplete: string; show: boolean; hint?: string }) {
  const id = `pw-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full min-h-11 rounded-xl bg-surface border border-line-strong px-3.5 text-[15px] text-fg focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-[12.5px] text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ system status */

export interface SystemCheck {
  label: string;
  tone: "ok" | "warn" | "error" | "muted";
  detail: string;
}

export function SystemStatus({ checks }: { checks: SystemCheck[] }) {
  return (
    <Group title="System status" description="Checked when this page loaded." defaultOpen={false}>
      <ul className="flex flex-col divide-y divide-line">
        {checks.map((c) => (
          <li key={c.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5">
            <span className="text-[14px] text-fg">{c.label}</span>
            <StatusLine tone={c.tone}>{c.detail}</StatusLine>
          </li>
        ))}
      </ul>
    </Group>
  );
}


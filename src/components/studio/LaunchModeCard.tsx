"use client";

import { useMemo, useState } from "react";
import { Button, Group, StatusLine, Switch } from "./fields";
import ConfirmDialog from "./ConfirmDialog";
import { LAUNCH_PRESETS, simulateReport, type LaunchConfig, type LaunchPreset } from "@/lib/analytics/model";
import { countryName } from "@/lib/analytics/countries";
import { readLaunchModeAction, saveLaunchModeAction, type LaunchModeResult } from "@/app/saint-denis/analytics/actions";

const n = (v: number) => v.toLocaleString("en-IN");

/** Launch Mode controls: on/off, the six ceilings, a preview, and an explicit save. */
export default function LaunchModeCard({ initial, unreadable }: { initial: LaunchConfig; unreadable: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [preset, setPreset] = useState<LaunchPreset>(initial.preset);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const dirty = enabled !== saved.enabled || (enabled && preset !== saved.preset);
  const [now] = useState(() => Date.now());

  // a preview with a fixed example seed: the real seed is drawn when the change is saved
  const preview = useMemo(() => {
    const seed = saved.enabled && preset === saved.preset ? saved.seed : 7919 * preset;
    return { d30: simulateReport({ preset, seed }, "30d", now), d1: simulateReport({ preset, seed }, "24h", now) };
  }, [preset, saved, now]);

  const savedNote = (c: LaunchConfig) =>
    c.enabled ? `Launch Mode is on with the ${n(c.preset)} ceiling. The public page updates within a minute.` : "Launch Mode is off. The public page shows recorded traffic only.";

  // Success only on a confirmed save. When no answer arrives (a dropped connection, a platform
  // error), the stored setting is read back instead of guessed: the card then shows what is
  // actually saved, and a retry is always a deliberate click.
  const save = async () => {
    setConfirm(false);
    setBusy(true);
    setNote(null);
    const want = { enabled, preset };
    const res: LaunchModeResult | null = await saveLaunchModeAction(want).catch(() => null);
    if (res?.success && res.config) {
      setSaved(res.config);
      setNote({ tone: "ok", text: savedNote(res.config) });
    } else if (res) {
      setNote({ tone: "error", text: res.error || "Not saved." });
    } else {
      const check = await readLaunchModeAction().catch(() => null);
      const stored = check?.success ? check.config : undefined;
      if (stored && stored.enabled === want.enabled && (!want.enabled || stored.preset === want.preset)) {
        setSaved(stored);
        setNote({ tone: "ok", text: `Saved (confirmed after a slow response). ${savedNote(stored)}` });
      } else if (stored) {
        setSaved(stored);
        setNote({ tone: "error", text: "Not saved: the server did not answer. The saved setting is shown; try again." });
      } else {
        setNote({ tone: "error", text: "The server did not answer and the saved setting could not be checked. Reload before trying again." });
      }
    }
    setBusy(false);
  };

  return (
    <Group
      title="Launch Mode"
      badge={<span className={`label-mono ${saved.enabled ? "text-accent" : "text-fg-subtle"}`}>{saved.enabled ? `On · ${n(saved.preset)}` : "Off"}</span>}
    >
      {unreadable && <StatusLine tone="error">The current setting could not be read. Saving is disabled until the database is reachable.</StatusLine>}
      <Switch
        label="Show simulated launch activity"
        checked={enabled}
        onChange={setEnabled}
        disabled={busy || unreadable}
      />

      <fieldset className="flex flex-col gap-2" disabled={busy || unreadable}>
        <legend className="text-[13px] font-medium text-fg mb-1.5">Ceiling for simulated visitors (30 days)</legend>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {LAUNCH_PRESETS.map((p) => (
            <label
              key={p}
              className={`relative inline-flex items-center justify-center min-h-11 rounded-xl border text-[14px] tabular-nums cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                preset === p ? "border-fg bg-fg text-bg" : "border-line text-fg-muted hover:text-fg hover:border-line-strong"
              }`}
            >
              <input type="radio" name="launch-preset" value={p} checked={preset === p} onChange={() => setPreset(p)} className="sr-only" />
              {n(p)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-xl border border-line bg-surface-2/50 p-4">
        <p className="label-mono text-fg-subtle">Preview · {n(preset)} ceiling</p>
        <p className="mt-2 text-[14px] text-fg">
          About <strong className="tabular-nums">{n(preview.d30.visitors)}</strong> simulated visitors over 30 days ({n(preview.d30.pageViews)} page views),{" "}
          <span className="tabular-nums">{n(preview.d1.visitors)}</span> in the last 24 hours, across {preview.d30.countries.length} countries.
        </p>
        <p className="mt-1 text-[12.5px] text-fg-muted">
          Leading: {preview.d30.countries.slice(0, 4).map((c) => `${countryName(c.code)} ${n(c.visitors)}`).join(" · ")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="primary" busy={busy} disabled={!dirty || busy || unreadable} onClick={() => setConfirm(true)}>
          {enabled ? (saved.enabled ? "Apply preset" : "Turn on Launch Mode") : "Turn off Launch Mode"}
        </Button>
        {dirty && !busy && (
          <Button
            tone="ghost"
            onClick={() => {
              setEnabled(saved.enabled);
              setPreset(saved.preset);
            }}
          >
            Discard
          </Button>
        )}
        {note && (
          <p role={note.tone === "error" ? "alert" : "status"} className={`text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
            {note.text}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        title={enabled ? (saved.enabled ? `Switch to the ${n(preset)} ceiling?` : "Turn on Launch Mode?") : "Turn off Launch Mode?"}
        confirmLabel={enabled ? (saved.enabled ? "Apply preset" : "Turn on") : "Turn off"}
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={save}
      >
        {enabled
          ? "The public Analytics page will add simulated launch activity to recorded visits, with a visible note saying so."
          : "The public Analytics page will show recorded visits only. Nothing recorded is changed."}
      </ConfirmDialog>
    </Group>
  );
}

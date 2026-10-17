"use client";

import { useEffect, useState } from "react";
import { Monitor, RotateCcw, Smartphone, Sparkles, X } from "lucide-react";
import { Button, FieldGrid, Group, Segmented, StatusLine, Switch, TextField } from "./fields";
import ConfirmDialog from "./ConfirmDialog";
import { useUnsavedChanges } from "./UnsavedChanges";
import type { LaunchExperienceContent } from "@/lib/site-content";
import { saveLaunchExperienceAction, startNewLaunchEventAction } from "@/app/saint-denis/settings/actions";
import { parseKolkataDateTimeInput, toKolkataDateTimeInput } from "@/lib/dateUtils";
import {
  AWAKENING_DONE_KEY,
  SUPERNOVA_DURATIONS,
  SUPERNOVA_SUBTITLE_MAX,
  SUPERNOVA_TITLE_MAX,
  launchState,
  parseLaunchInstant,
  readDoneEvents,
  supernovaDuration,
  supernovaTimeline,
  type LaunchState,
  type LaunchStatus,
} from "@/lib/startup/launch";
import FutureSystem from "@/components/startup/FutureSystem";

/* The Studio form edits schedule instants as IST wall time (datetime-local); the server converts
   them to UTC. Older date-only values are shown as the instants they mean. */
interface Form {
  enabled: boolean;
  primaryMessage: string;
  secondaryMessage: string;
  duration: string;
  start: string;
  end: string;
  launchVersion: string;
  showFrequency: LaunchExperienceContent["showFrequency"];
}

function istInput(value: string | null | undefined, edge: "start" | "end"): string {
  const t = parseLaunchInstant(value, edge);
  if (t === null) return "";
  if (Number.isNaN(t)) return String(value ?? "");
  return toKolkataDateTimeInput(new Date(t));
}

function toForm(c: LaunchExperienceContent): Form {
  return {
    enabled: c.enabled,
    primaryMessage: c.primaryMessage,
    secondaryMessage: c.secondaryMessage ?? "",
    duration: String(supernovaDuration(c.duration)),
    start: istInput(c.startDate, "start"),
    end: istInput(c.endDate, "end"),
    launchVersion: c.launchVersion,
    showFrequency: c.showFrequency,
  };
}

/** The form as the server will read it (IST input → UTC instants). */
function asSettings(f: Form) {
  const instant = (v: string) => (v.trim() ? (parseKolkataDateTimeInput(v) ?? "unreadable") : null);
  return {
    enabled: f.enabled,
    primaryMessage: f.primaryMessage,
    secondaryMessage: f.secondaryMessage,
    duration: Number(f.duration),
    startDate: instant(f.start),
    endDate: instant(f.end),
    launchVersion: f.launchVersion,
  };
}

const STATUS: Record<LaunchStatus, { label: string; tone: "ok" | "warn" | "error" | "muted" }> = {
  disabled: { label: "Disabled", tone: "muted" },
  armed: { label: "Armed", tone: "warn" },
  active: { label: "Active", tone: "ok" },
  expired: { label: "Expired", tone: "muted" },
  error: { label: "Configuration error", tone: "error" },
};

const IST_LABEL = "IST (Asia/Kolkata, UTC+05:30)";
const fmtIst = (ms: number | null) =>
  ms === null
    ? "no limit"
    : new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short", hourCycle: "h23" }).format(new Date(ms)) + " IST";

function statusSentence(s: LaunchState): string {
  switch (s.status) {
    case "disabled":
      return "Switched off. Visitors see the short normal startup.";
    case "armed":
      return `Waiting. Starts ${fmtIst(s.startMs)}${s.endMs !== null ? `, ends ${fmtIst(s.endMs)}` : ""}.`;
    case "active":
      return `Playing once for each visitor who has not seen it${s.endMs !== null ? ` until ${fmtIst(s.endMs)}` : ""}.`;
    case "expired":
      return `Ended ${fmtIst(s.endMs)}. It stopped by itself; nothing else needs to happen.`;
    case "error":
      return `Not playing: ${s.reason}`;
  }
}

type PreviewKind = "supernova" | "awakening";

function PreviewStage({ form, layout, kind, reduced, logo, onClose }: { form: Form; layout: "desktop" | "mobile"; kind: PreviewKind; reduced: boolean; logo?: { url: string; alt?: string } | null; onClose: () => void }) {
  const [run, setRun] = useState(0);
  const [ended, setEnded] = useState<string | null>(null);
  const replay = () => {
    setEnded(null);
    setRun((r) => r + 1);
  };
  // preview only: nothing is recorded, so watching it never uses up a visitor's launch
  const done = (how: string) => setEnded(how === "skip" ? "Skipped" : "Finished");
  const frame =
    layout === "mobile"
      ? "h-[min(76vh,700px)] aspect-[390/844] rounded-[34px] border-[6px] border-neutral-800"
      : "w-[min(1040px,92vw)] aspect-[16/10] max-h-[72vh] rounded-xl border border-neutral-700";
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`${layout === "mobile" ? "Smartphone" : "Desktop"} preview`}>
      <div className={`relative overflow-hidden bg-[#101019] shadow-2xl ${frame}`}>
        {ended ? (
          <div className="absolute inset-0 flex items-center justify-center text-[13px] text-neutral-300">{ended}. The site would now be visible.</div>
        ) : (
          <FutureSystem
            key={run}
            mode={kind === "supernova" ? "launch" : "awakening"}
            title={form.primaryMessage.trim() || "RAWIN v3.0"}
            subtitle={form.secondaryMessage.trim()}
            durationS={Number(form.duration)}
            layout={layout}
            reduced={reduced}
            logo={logo}
            onDone={done}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button tone="secondary" onClick={replay}>
          <RotateCcw aria-hidden="true" className="w-4 h-4" />
          Replay
        </Button>
        <Button tone="secondary" onClick={onClose}>
          <X aria-hidden="true" className="w-4 h-4" />
          Close preview
        </Button>
      </div>
      <p className="text-[12px] text-neutral-400 text-center max-w-md">Preview only: it uses the live components, records nothing and changes nothing for visitors.</p>
    </div>
  );
}

export default function LaunchCard({ initial, logo }: { initial: LaunchExperienceContent; logo?: { url: string; alt?: string } | null }) {
  const [v, setV] = useState<Form>(() => toForm(initial));
  const [base, setBase] = useState<Form>(() => toForm(initial));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<{ layout: "desktop" | "mobile" } | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>("supernova");
  const [previewReduced, setPreviewReduced] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [browser, setBrowser] = useState<{ done: string[]; awakening: boolean } | null>(null);
  const { setDirty } = useUnsavedChanges();
  const dirty = JSON.stringify(v) !== JSON.stringify(base);
  useEffect(() => {
    setDirty("launch", dirty);
    return () => setDirty("launch", false);
  }, [dirty, setDirty]);

  // the displayed status follows the clock (the site's own expiry needs no open Studio tab)
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 15000);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, []);
  // this browser's own startup records, read only (for diagnostics)
  useEffect(() => {
    const read = () => {
      let awakening = false;
      try {
        awakening = window.sessionStorage.getItem(AWAKENING_DONE_KEY) === "1";
      } catch {}
      let done: string[] = [];
      try {
        done = readDoneEvents(window.localStorage);
      } catch {}
      setBrowser({ done, awakening });
    };
    const first = requestAnimationFrame(read);
    return () => cancelAnimationFrame(first);
  }, [preview]);

  const set = <K extends keyof Form>(k: K, x: Form[K]) => setV((o) => ({ ...o, [k]: x }));
  const saved = launchState(asSettings(base), now ?? 0);
  const draft = launchState(asSettings(v), now ?? 0);
  const fieldError = (field: string) => draftProblem(v, field);

  const save = async () => {
    setBusy(true);
    setNote(null);
    const res = await saveLaunchExperienceAction({
      enabled: v.enabled,
      primaryMessage: v.primaryMessage,
      secondaryMessage: v.secondaryMessage,
      duration: Number(v.duration),
      startDate: v.start || null,
      endDate: v.end || null,
      launchVersion: v.launchVersion,
      showFrequency: v.showFrequency,
    }).catch(() => ({ error: "The server could not be reached." }) as { error?: string; success?: boolean; launchExperience?: LaunchExperienceContent });
    setBusy(false);
    if (res.success && res.launchExperience) {
      const next = toForm(res.launchExperience);
      setV(next);
      setBase(next);
      setNote({ tone: "ok", text: "Saved. Visitors get the new settings on their next page load." });
    } else setNote({ tone: "error", text: res.error || "Not saved." });
  };

  const issueEvent = async () => {
    setIssuing(true);
    setNote(null);
    const res = await startNewLaunchEventAction().catch(() => ({ error: "The server could not be reached." }) as { error?: string; success?: boolean; message?: string; launchExperience?: Partial<LaunchExperienceContent> });
    setIssuing(false);
    setConfirmNew(false);
    const id = res.launchExperience?.launchVersion;
    if (res.success && id) {
      setV((o) => ({ ...o, launchVersion: id }));
      setBase((o) => ({ ...o, launchVersion: id }));
      setNote({ tone: "ok", text: res.message || "New launch event issued." });
    } else setNote({ tone: "error", text: res.error || "No new launch event was issued." });
  };

  const st = STATUS[saved.status];
  const timeline = supernovaTimeline(Number(v.duration));
  return (
    <Group
      title="Special launch (Supernova)"
      description="The extended Future System sequence: once per visitor while its window is open, instead of the normal startup."
      defaultOpen={false}
      badge={now !== null ? <StatusLine tone={st.tone}>{st.label}</StatusLine> : null}
    >
      <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-3 flex flex-col gap-1" aria-live="polite">
        <span className="text-[13px] font-medium text-fg">
          {now === null ? "Checking status…" : <StatusLine tone={st.tone}>{st.label}</StatusLine>}
        </span>
        {now !== null && <span className="text-[13px] text-fg-muted">{statusSentence(saved)}</span>}
        {dirty && now !== null && draft.status !== saved.status && (
          <span className="text-[12.5px] text-fg-subtle">
            After saving: {STATUS[draft.status].label}
            {draft.status === "error" && draft.reason ? ` (${draft.reason})` : ""}
          </span>
        )}
      </div>

      <Switch label="Special launch is on" checked={v.enabled} onChange={(x) => set("enabled", x)} hint="Off: everyone sees the short Future System startup once per session." />
      <FieldGrid>
        <TextField label="Title" value={v.primaryMessage} onChange={(x) => set("primaryMessage", x)} maxLength={SUPERNOVA_TITLE_MAX} error={fieldError("primaryMessage")} hint="Shown in the dark opening, e.g. “RAWIN v3.0”." />
        <TextField label="Line under the title (optional)" value={v.secondaryMessage} onChange={(x) => set("secondaryMessage", x)} maxLength={SUPERNOVA_SUBTITLE_MAX} />
      </FieldGrid>
      <Segmented
        label="Length"
        value={v.duration}
        onChange={(x) => set("duration", x)}
        options={SUPERNOVA_DURATIONS.map((d) => ({ value: String(d), label: `${d} s` }))}
        hint="Every stage scales with the length."
      />
      <FieldGrid>
        <TextField label="Starts" type="datetime-local" value={v.start} onChange={(x) => set("start", x)} error={fieldError("startDate")} hint={`${IST_LABEL}. Empty: starts as soon as it is on.`} />
        <TextField label="Ends" type="datetime-local" value={v.end} onChange={(x) => set("end", x)} error={fieldError("endDate")} hint={`${IST_LABEL}. Empty: no end. It stops by itself at this time.`} />
      </FieldGrid>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-line px-4 py-3">
        <div className="min-w-0">
          <span className="block text-[12px] text-fg-subtle">Launch event</span>
          <code className="block text-[13.5px] text-fg break-all">{v.launchVersion || "none"}</code>
          <span className="block mt-1 text-[12px] text-fg-subtle">Visitors who finished this event do not see it again. A new event makes everyone eligible once more.</span>
        </div>
        <Button tone="secondary" onClick={() => setConfirmNew(true)}>
          <Sparkles aria-hidden="true" className="w-4 h-4" />
          New launch event
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line px-4 py-3">
        <span className="text-[13px] font-medium text-fg">Preview</span>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Animation"
            value={previewKind}
            onChange={setPreviewKind}
            options={[
              { value: "supernova", label: "Special launch" },
              { value: "awakening", label: "Normal startup" },
            ]}
          />
          <Switch label="Reduced motion" checked={previewReduced} onChange={setPreviewReduced} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" onClick={() => setPreview({ layout: "desktop" })}>
            <Monitor aria-hidden="true" className="w-4 h-4" />
            Desktop preview
          </Button>
          <Button tone="secondary" onClick={() => setPreview({ layout: "mobile" })}>
            <Smartphone aria-hidden="true" className="w-4 h-4" />
            Smartphone preview
          </Button>
        </div>
        <span className="text-[12px] text-fg-subtle">Uses the unsaved form values. Previews record nothing and never use up a visitor&rsquo;s launch.</span>
      </div>

      <details className="rounded-xl border border-line px-4 py-3 text-[12.5px] text-fg-muted">
        <summary className="cursor-pointer text-[13px] font-medium text-fg">Diagnostics</summary>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-fg-subtle">Now</dt>
          <dd>{now === null ? "…" : `${fmtIst(now)} (${new Date(now).toISOString()})`}</dd>
          <dt className="text-fg-subtle">Saved status</dt>
          <dd>
            {STATUS[saved.status].label}
            {saved.reason ? `: ${saved.reason}` : ""}
          </dd>
          <dt className="text-fg-subtle">Window start</dt>
          <dd>{saved.startMs === null ? "no limit" : `${fmtIst(saved.startMs)} (${new Date(saved.startMs).toISOString()})`}</dd>
          <dt className="text-fg-subtle">Window end</dt>
          <dd>{saved.endMs === null ? "no limit" : `${fmtIst(saved.endMs)} (${new Date(saved.endMs).toISOString()})`}</dd>
          <dt className="text-fg-subtle">Event id</dt>
          <dd>{base.launchVersion}</dd>
          <dt className="text-fg-subtle">Problems</dt>
          <dd>{saved.problems.length ? saved.problems.join(" ") : "none"}</dd>
          <dt className="text-fg-subtle">Stages ({v.duration} s)</dt>
          <dd>{timeline.map((s) => `${s.id} ${(s.startMs / 1000).toFixed(1)}–${(s.endMs / 1000).toFixed(1)} s`).join(" · ")}</dd>
          <dt className="text-fg-subtle">This browser</dt>
          <dd>
            {browser === null
              ? "…"
              : `${browser.done.includes(base.launchVersion) ? "has finished this event" : "has not finished this event"}; normal startup ${browser.awakening ? "done" : "not yet shown"} this session.`}
          </dd>
          <dt className="text-fg-subtle">Expiry</dt>
          <dd>Checked by each visitor&rsquo;s browser against the saved window on every page load; no server job or open Studio tab is involved.</dd>
        </dl>
      </details>

      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`text-[13px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
          {note.text}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        {dirty && (
          <Button tone="ghost" onClick={() => setV(base)}>
            Discard
          </Button>
        )}
        <Button tone="primary" disabled={!dirty} busy={busy} onClick={save}>
          Save
        </Button>
      </div>

      <ConfirmDialog open={confirmNew} title="Start a new launch event?" confirmLabel="Issue new event" busy={issuing} onConfirm={issueEvent} onCancel={() => setConfirmNew(false)}>
        Every visitor, including those who already watched “{base.launchVersion}”, will see the special launch once more while the window is open. Only the event id changes; unsaved edits stay in the form.
      </ConfirmDialog>
      {preview && <PreviewStage form={v} layout={preview.layout} kind={previewKind} reduced={previewReduced} logo={logo} onClose={() => setPreview(null)} />}
    </Group>
  );
}

/** The validation message for one field of the form, if it has one. */
function draftProblem(f: Form, field: string): string | undefined {
  const title = f.primaryMessage.trim();
  if (field === "primaryMessage") {
    if (!title) return "Give the launch a title.";
    if (title.length > SUPERNOVA_TITLE_MAX) return `At most ${SUPERNOVA_TITLE_MAX} characters.`;
  }
  const s = asSettings(f);
  const start = parseLaunchInstant(s.startDate, "start");
  const end = parseLaunchInstant(s.endDate, "end");
  if (field === "startDate" && Number.isNaN(start)) return "This time cannot be read.";
  if (field === "endDate") {
    if (Number.isNaN(end)) return "This time cannot be read.";
    if (typeof start === "number" && typeof end === "number" && !Number.isNaN(start) && end <= start) return "The end must be after the start.";
  }
  return undefined;
}

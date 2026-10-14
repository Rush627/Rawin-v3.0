"use client";

import { useState } from "react";
import FilePick from "../FilePick";
import { RotateCcw } from "lucide-react";
import { Button, FieldGrid, Group, SelectField, Switch, TextField } from "../fields";
import { ListEditor, StringListEditor } from "../ListEditor";
import { useSectionEditor } from "../useSectionEditor";
import EditorFrame, { ICON_OPTIONS } from "./EditorFrame";
import { CAPABILITY_LEVELS, type CapabilityGroup, type JourneyItem, type ValueItem } from "@/lib/cms/fields";
import type { EditorValues } from "@/lib/cms/serialize";
import { resetMilestoneImageAction, uploadMilestoneImageAction } from "@/app/saint-denis/content/actions";
import { evolutionFallback, isUploadedAsset } from "@/lib/brand-assets";

/* ------------------------------------------------------------------ Home */

export interface HomeValues extends EditorValues {
  heroTitlePrefix: string;
  heroName: string;
  heroBio: string;
  heroPrimaryCtaText: string;
  heroSecondaryCtaText: string;
  heroTypingPhrases: string[];
  featuredHeading: string;
  featuredDescription: string;
  showHeroFocus: boolean;
  showHeroAvailability: boolean;
  showHeroWork: boolean;
  showCapabilities: boolean;
  showValues: boolean;
  showJourney: boolean;
  capabilities: CapabilityGroup[];
  values: ValueItem[];
}

export function HomeEditor({ initial }: { initial: HomeValues }) {
  const ed = useSectionEditor("home", initial);
  const v = ed.values;
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/" changedCount={ed.changed.length}>
      <Group title="Hero">
        <FieldGrid>
          <TextField label="Greeting" value={v.heroTitlePrefix} onChange={(x) => ed.set("heroTitlePrefix", x)} maxLength={60} error={ed.errors.heroTitlePrefix} />
          <TextField label="Name" value={v.heroName} onChange={(x) => ed.set("heroName", x)} maxLength={80} error={ed.errors.heroName} />
        </FieldGrid>
        <TextField label="Introduction" value={v.heroBio} onChange={(x) => ed.set("heroBio", x)} multiline maxLength={400} error={ed.errors.heroBio} />
        <FieldGrid>
          <TextField label="Primary button" value={v.heroPrimaryCtaText} onChange={(x) => ed.set("heroPrimaryCtaText", x)} maxLength={40} hint="Opens /projects" error={ed.errors.heroPrimaryCtaText} />
          <TextField label="Secondary link" value={v.heroSecondaryCtaText} onChange={(x) => ed.set("heroSecondaryCtaText", x)} maxLength={40} hint="Opens /contact" error={ed.errors.heroSecondaryCtaText} />
        </FieldGrid>
        <StringListEditor label="Rotating roles" items={v.heroTypingPhrases} onChange={(x) => ed.set("heroTypingPhrases", x)} max={25} maxLength={100} error={ed.errors.heroTypingPhrases} addLabel="Add role" />
      </Group>
      <Group title="Hero panels" description="Availability itself is set in Settings → Availability." defaultOpen={false}>
        <Switch label="Current focus" checked={v.showHeroFocus} onChange={(x) => ed.set("showHeroFocus", x)} />
        <Switch label="Availability" checked={v.showHeroAvailability} onChange={(x) => ed.set("showHeroAvailability", x)} />
        <Switch label="Featured work" checked={v.showHeroWork} onChange={(x) => ed.set("showHeroWork", x)} />
      </Group>
      <Group title="Selected work" description="Featured projects are chosen in Projects." defaultOpen={false}>
        <FieldGrid>
          <TextField label="Heading" value={v.featuredHeading} onChange={(x) => ed.set("featuredHeading", x)} maxLength={80} error={ed.errors.featuredHeading} />
          <TextField label="Eyebrow" value={v.featuredDescription} onChange={(x) => ed.set("featuredDescription", x)} maxLength={60} error={ed.errors.featuredDescription} />
        </FieldGrid>
      </Group>
      <Group title="The working toolkit" description="Section 02" defaultOpen={false}>
        <Switch label="Show this section" checked={v.showCapabilities} onChange={(x) => ed.set("showCapabilities", x)} />
        <ListEditor<CapabilityGroup>
          label="Groups"
          items={v.capabilities}
          onChange={(x) => ed.set("capabilities", x)}
          createItem={() => ({ title: "", badge: "", description: "", items: [] })}
          itemTitle={(g) => g.title}
          itemMeta={(g) => `${g.items.length} skill${g.items.length === 1 ? "" : "s"}`}
          max={8}
          min={1}
          error={ed.errors.capabilities}
          addLabel="Add group"
          renderItem={(g, update) => (
            <>
              <FieldGrid>
                <TextField label="Title" value={g.title} onChange={(x) => update({ title: x })} maxLength={60} />
                <TextField label="Badge" value={g.badge} onChange={(x) => update({ badge: x })} maxLength={40} />
              </FieldGrid>
              <TextField label="Description" value={g.description} onChange={(x) => update({ description: x })} multiline rows={2} maxLength={300} />
              <ListEditor
                label="Skills"
                items={g.items}
                onChange={(items) => update({ items })}
                createItem={() => ({ name: "", level: "Proficient" as const, description: "", highlight: false })}
                itemTitle={(s) => s.name}
                itemMeta={(s) => s.level}
                max={12}
                addLabel="Add skill"
                renderItem={(s, upd) => (
                  <>
                    <FieldGrid>
                      <TextField label="Skill" value={s.name} onChange={(x) => upd({ name: x })} maxLength={60} />
                      <SelectField label="Level" value={s.level} onChange={(x) => upd({ level: x })} options={CAPABILITY_LEVELS.map((l) => ({ value: l, label: l }))} />
                    </FieldGrid>
                    <TextField label="Detail" value={s.description} onChange={(x) => upd({ description: x })} maxLength={200} />
                    <Switch label="Highlight" checked={Boolean(s.highlight)} onChange={(x) => upd({ highlight: x })} />
                  </>
                )}
              />
            </>
          )}
        />
      </Group>
      <Group title="Why work with me" description="Section 03" defaultOpen={false}>
        <Switch label="Show this section" checked={v.showValues} onChange={(x) => ed.set("showValues", x)} />
        <ListEditor<ValueItem>
          label="Values"
          items={v.values}
          onChange={(x) => ed.set("values", x)}
          createItem={() => ({ title: "", tagline: "", description: "" })}
          itemTitle={(x) => x.title}
          itemMeta={(x) => x.tagline}
          max={8}
          min={1}
          error={ed.errors.values}
          addLabel="Add value"
          renderItem={(x, update) => (
            <>
              <FieldGrid>
                <TextField label="Title" value={x.title} onChange={(t) => update({ title: t })} maxLength={60} />
                <TextField label="Tagline" value={x.tagline} onChange={(t) => update({ tagline: t })} maxLength={100} />
              </FieldGrid>
              <TextField label="Description" value={x.description} onChange={(t) => update({ description: t })} multiline maxLength={400} />
            </>
          )}
        />
      </Group>
      <Group title="Engineering journey" description="Section 04 · the entries are shared with the About page (edit them under About)." defaultOpen={false}>
        <Switch label="Show this section" checked={v.showJourney} onChange={(x) => ed.set("showJourney", x)} />
      </Group>
    </EditorFrame>
  );
}

/* ------------------------------------------------------------------ About */

interface Milestone {
  [key: string]: unknown;
  id: string;
  year: string;
  label: string;
  progression: string;
  title: string;
  domain: string;
  description: string;
  technologies: string[];
  url?: string;
  isCurrent: boolean;
  preview: string;
  previewAlt?: string;
  ctaText: string;
}
interface Principle {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  statement: string;
  icon: string;
}
interface Focus {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string;
  icon: string;
}

const ABOUT_TEXT: [string, string, number, boolean?][] = [
  ["eyebrow", "Eyebrow", 60],
  ["title", "Title", 120],
  ["subtitle", "Subtitle", 200],
];

export function AboutEditor({ initial }: { initial: Record<string, unknown> }) {
  const ed = useSectionEditor("about", initial as EditorValues);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed About document
  const v = ed.values as Record<string, any>;
  const text = (key: string, label: string, max: number, multiline = false, hint?: string) => (
    <TextField key={key} label={label} value={v[key] ?? ""} onChange={(x) => ed.set(key, x)} maxLength={max} multiline={multiline} hint={hint} error={ed.errors[key]} />
  );
  const labels = v.milestoneLabels as { milestone01: string; milestone02: string; milestone03: string; currentEra: string };
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/about" changedCount={ed.changed.length}>
      <Group title="Opening">
        <FieldGrid cols={3}>{ABOUT_TEXT.map(([k, l, m]) => text(k, l, m))}</FieldGrid>
        {text("leadText", "Lead paragraph", 600, true)}
        <FieldGrid cols={3}>
          {text("progressionItem1", "Progression 1", 40)}
          {text("progressionItem2", "Progression 2", 40)}
          {text("progressionItem3", "Progression 3", 40)}
        </FieldGrid>
        <FieldGrid>
          {text("metadataItem1", "Tag 1", 40)}
          {text("metadataItem2", "Tag 2", 40)}
          {text("metadataItem3", "Tag 3", 40)}
          {text("metadataItem4", "Tag 4", 40)}
        </FieldGrid>
      </Group>
      <Group title="How I think" defaultOpen={false}>
        {text("narrativeEyebrow", "Eyebrow", 60)}
        {text("narrativeText", "Narrative", 2000, true)}
      </Group>
      <Group title="Evolution" description="Milestones and their screenshots." defaultOpen={false}>
        <FieldGrid>
          {text("evolutionEyebrow", "Eyebrow", 60)}
          {text("evolutionHeading", "Heading", 160)}
        </FieldGrid>
        {text("evolutionDescription", "Description", 600, true)}
        <FieldGrid>
          <TextField label="Milestone 01 label" value={labels.milestone01} onChange={(x) => ed.set("milestoneLabels", { ...labels, milestone01: x })} maxLength={80} />
          <TextField label="Milestone 02 label" value={labels.milestone02} onChange={(x) => ed.set("milestoneLabels", { ...labels, milestone02: x })} maxLength={80} />
          <TextField label="Milestone 03 label" value={labels.milestone03} onChange={(x) => ed.set("milestoneLabels", { ...labels, milestone03: x })} maxLength={80} />
          <TextField label="Current era label" value={labels.currentEra} onChange={(x) => ed.set("milestoneLabels", { ...labels, currentEra: x })} maxLength={80} />
        </FieldGrid>
        <ListEditor<Milestone>
          label="Milestones"
          items={v.evolution as Milestone[]}
          onChange={(x) => ed.set("evolution", x as never)}
          createItem={() => ({ id: `milestone-${Date.now().toString(36)}`, year: "", label: "", progression: "", title: "", domain: "", description: "", technologies: [], url: "", isCurrent: false, preview: "", previewAlt: "", ctaText: "VIEW WEBSITE" })}
          itemTitle={(m) => (m.year ? `${m.year} · ${m.title}` : m.title)}
          itemMeta={(m) => (m.isCurrent ? "Current" : m.domain)}
          max={20}
          error={ed.errors.evolution}
          addLabel="Add milestone"
          renderItem={(m, update) => (
            <>
              <MilestoneImage milestone={m} onUploaded={(url) => update({ preview: url })} />
              <FieldGrid cols={3}>
                <TextField label="Year" value={m.year} onChange={(x) => update({ year: x })} maxLength={10} inputMode="numeric" />
                <TextField label="Label" value={m.label} onChange={(x) => update({ label: x })} maxLength={60} />
                <TextField label="Domain" value={m.domain} onChange={(x) => update({ domain: x })} maxLength={100} />
              </FieldGrid>
              <FieldGrid>
                <TextField label="Title" value={m.title} onChange={(x) => update({ title: x })} maxLength={100} />
                <TextField label="Progression line" value={m.progression} onChange={(x) => update({ progression: x })} maxLength={100} />
              </FieldGrid>
              <TextField label="Description" value={m.description} onChange={(x) => update({ description: x })} multiline maxLength={1000} />
              <FieldGrid>
                <TextField label="Link" type="url" inputMode="url" value={m.url || ""} onChange={(x) => update({ url: x })} maxLength={300} />
                <TextField label="Button text" value={m.ctaText} onChange={(x) => update({ ctaText: x })} maxLength={50} />
              </FieldGrid>
              <TextField label="Screenshot description (alt text)" value={m.previewAlt || ""} onChange={(x) => update({ previewAlt: x })} maxLength={150} />
              <StringListEditor label="Technologies" items={m.technologies} onChange={(x) => update({ technologies: x })} max={15} maxLength={40} addLabel="Add technology" />
              <Switch label="Current era" checked={m.isCurrent} onChange={(x) => update({ isCurrent: x })} />
            </>
          )}
        />
      </Group>
      <Group title="Principles" defaultOpen={false}>
        <FieldGrid>
          {text("principlesEyebrow", "Eyebrow", 60)}
          {text("principlesHeading", "Heading", 160)}
        </FieldGrid>
        {text("principlesDescription", "Description", 600, true)}
        <ListEditor<Principle>
          label="Principles"
          items={v.principles as Principle[]}
          onChange={(x) => ed.set("principles", x as never)}
          createItem={() => ({ id: `principle-${Date.now().toString(36)}`, number: "", title: "", statement: "", icon: "layers" })}
          itemTitle={(p) => p.title}
          itemMeta={(p) => p.statement}
          max={20}
          error={ed.errors.principles}
          addLabel="Add principle"
          renderItem={(p, update) => (
            <>
              <FieldGrid cols={3}>
                <TextField label="Number" value={p.number} onChange={(x) => update({ number: x })} maxLength={10} />
                <TextField label="Title" value={p.title} onChange={(x) => update({ title: x })} maxLength={60} />
                <SelectField label="Icon" value={p.icon} onChange={(x) => update({ icon: x })} options={ICON_OPTIONS} />
              </FieldGrid>
              <TextField label="Statement" value={p.statement} onChange={(x) => update({ statement: x })} maxLength={200} />
            </>
          )}
        />
      </Group>
      <Group title="Engineering journey" description="Shared with the homepage (section 04)." defaultOpen={false}>
        <FieldGrid>
          {text("journeyEyebrow", "Eyebrow", 60)}
          {text("journeyHeading", "Heading", 160)}
        </FieldGrid>
        {text("journeyDescription", "Description", 600, true)}
        <ListEditor<JourneyItem>
          label="Entries"
          items={v.journey as JourneyItem[]}
          onChange={(x) => ed.set("journey", x as never)}
          createItem={() => ({ period: "", role: "", context: "", description: "", highlights: [] })}
          itemTitle={(j) => j.role}
          itemMeta={(j) => [j.period, j.context].filter(Boolean).join(" · ")}
          max={12}
          min={1}
          error={ed.errors.journey}
          addLabel="Add entry"
          renderItem={(j, update) => (
            <>
              <FieldGrid cols={3}>
                <TextField label="Period" value={j.period} onChange={(x) => update({ period: x })} maxLength={40} placeholder="2024 - Present" />
                <TextField label="Role" value={j.role} onChange={(x) => update({ role: x })} maxLength={100} />
                <TextField label="Organisation / context" value={j.context} onChange={(x) => update({ context: x })} maxLength={100} />
              </FieldGrid>
              <TextField label="Description" value={j.description} onChange={(x) => update({ description: x })} multiline maxLength={500} />
              <StringListEditor label="Highlights" items={j.highlights} onChange={(x) => update({ highlights: x })} max={6} maxLength={200} addLabel="Add highlight" />
            </>
          )}
        />
      </Group>
      <Group title="Current focus" defaultOpen={false}>
        <FieldGrid>
          {text("focusEyebrow", "Eyebrow", 60)}
          {text("focusHeading", "Heading", 160)}
        </FieldGrid>
        {text("focusDescription", "Description", 600, true)}
        <ListEditor<Focus>
          label="Focus areas"
          items={v.focusAreas as Focus[]}
          onChange={(x) => ed.set("focusAreas", x as never)}
          createItem={() => ({ id: `focus-${Date.now().toString(36)}`, title: "", description: "", icon: "terminal" })}
          itemTitle={(f) => f.title}
          max={20}
          error={ed.errors.focusAreas}
          addLabel="Add focus area"
          renderItem={(f, update) => (
            <>
              <FieldGrid>
                <TextField label="Title" value={f.title} onChange={(x) => update({ title: x })} maxLength={60} />
                <SelectField label="Icon" value={f.icon} onChange={(x) => update({ icon: x })} options={ICON_OPTIONS} />
              </FieldGrid>
              <TextField label="Description" value={f.description} onChange={(x) => update({ description: x })} multiline maxLength={300} />
            </>
          )}
        />
      </Group>
      <Group title="Closing call to action" defaultOpen={false}>
        <FieldGrid>
          {text("ctaEyebrow", "Eyebrow", 60)}
          {text("ctaHeading", "Heading", 120)}
        </FieldGrid>
        {text("ctaDescription", "Description", 300, true)}
        <FieldGrid>
          {text("ctaContactText", "Contact button", 40)}
          {text("ctaResumeText", "Resume button", 40)}
        </FieldGrid>
      </Group>
    </EditorFrame>
  );
}

/** Upload a milestone screenshot (JPEG, PNG or WebP, up to 5 MB). */
function MilestoneImage({ milestone, onUploaded }: { milestone: Milestone; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const hintId = `ms-hint-${milestone.id}`;
  const builtIn = evolutionFallback(milestone.year, milestone.id);
  const uploaded = isUploadedAsset(milestone.preview);
  const status = uploaded ? "Custom upload active" : milestone.preview ? "Built-in active" : "No screenshot";
  const useBuiltIn = async () => {
    setBusy(true);
    setNote(null);
    const res: { success?: boolean; error?: string } = await resetMilestoneImageAction(milestone.id).catch(() => ({ error: "The server could not be reached." }));
    setBusy(false);
    if (res.success) {
      onUploaded(builtIn);
      setNote({ tone: "ok", text: "Built-in screenshot restored and published." });
    } else setNote({ tone: "error", text: res.error || "Not changed." });
  };
  const pick = async (file: File) => {
    setBusy(true);
    setNote(null);
    const fd = new FormData();
    fd.append("milestoneId", milestone.id);
    fd.append("file", file);
    const res: { url?: string; linked?: boolean; error?: string } = await uploadMilestoneImageAction(fd).catch(() => ({ error: "The upload failed. Try again." }));
    setBusy(false);
    if (res.url) {
      onUploaded(res.url);
      setNote({ tone: "ok", text: res.linked ? "Uploaded and published." : "Uploaded. Save the About page to publish it." });
    } else {
      setNote({ tone: "error", text: res.error || "The upload failed." });
    }
  };
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="w-full sm:w-44 aspect-[16/10] rounded-xl border border-line bg-surface-2 overflow-hidden flex items-center justify-center">
        {milestone.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={milestone.preview} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-[12px] text-fg-subtle">No screenshot</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 items-start">
        <p className="label-mono text-fg-subtle">{status}</p>
        <div className="flex flex-wrap gap-2">
          <FilePick label={milestone.preview ? "Replace screenshot" : "Upload screenshot"} accept="image/jpeg,image/png,image/webp" busy={busy} onFile={pick} describedBy={hintId} />
          {uploaded && builtIn && (
            <Button tone="ghost" onClick={useBuiltIn} disabled={busy}>
              <RotateCcw aria-hidden="true" className="w-4 h-4" />
              Use built-in
            </Button>
          )}
        </div>
        <p id={hintId} className="text-[12px] text-fg-subtle">JPEG, PNG or WebP, up to 5 MB.</p>
        {note && (
          <p role={note.tone === "error" ? "alert" : "status"} className={`text-[12.5px] ${note.tone === "error" ? "text-danger" : "text-success"}`}>
            {note.text}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { FieldGrid, Group, SelectField, Switch, TextField } from "../fields";
import { ListEditor, StringListEditor } from "../ListEditor";
import { useSectionEditor } from "../useSectionEditor";
import EditorFrame, { ICON_OPTIONS } from "./EditorFrame";
import type { EditorValues } from "@/lib/cms/serialize";
import ResumePdfCard, { type ResumePdf } from "../ResumePdfCard";

/* ------------------------------------------------------------------ Uses */

interface DailyItem { [k: string]: unknown; id: string; name: string; description: string; category: string; icon: string; order?: number; enabled: boolean }
interface DevItem { [k: string]: unknown; id?: string; name: string; description: string; category?: string; icon?: string; group?: string; displayOrder: number; enabled?: boolean }
interface BuildStep { [k: string]: unknown; id?: string; step?: string; title: string; description: string; enabled?: boolean }
interface Exploring { [k: string]: unknown; name: string; description: string; category?: string; icon?: string; displayOrder: number }
type SetupKey = "mainMachine" | "fuel" | "currentStatus";
type Setup = Record<SetupKey, { label: string; value: string; description: string }>;

const reorder = <T extends Record<string, unknown>>(items: T[], key: string) => items.map((it, i) => ({ ...it, [key]: i + 1 }));

export function UsesEditor({ initial }: { initial: Record<string, unknown> }) {
  const ed = useSectionEditor("uses", initial as EditorValues);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed section document
  const v = ed.values as Record<string, any>;
  const setup = v.mySetup as Setup;
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/uses" changedCount={ed.changed.length}>
      <Group title="Page">
        <FieldGrid>
          <TextField label="Eyebrow" value={v.eyebrow} onChange={(x) => ed.set("eyebrow", x)} maxLength={60} error={ed.errors.eyebrow} />
          <TextField label="Title" value={v.title} onChange={(x) => ed.set("title", x)} maxLength={120} error={ed.errors.title} />
        </FieldGrid>
        <TextField label="Introduction" value={v.description} onChange={(x) => ed.set("description", x)} multiline maxLength={600} error={ed.errors.description} />
        <FieldGrid cols={3}>
          <TextField label="Ledger label" value={v.ledgerLabel} onChange={(x) => ed.set("ledgerLabel", x)} maxLength={40} error={ed.errors.ledgerLabel} />
          <TextField label="Ledger note" value={v.updateLabel} onChange={(x) => ed.set("updateLabel", x)} maxLength={80} error={ed.errors.updateLabel} />
          <TextField label="Year" value={v.updatedYear} onChange={(x) => ed.set("updatedYear", x)} maxLength={4} inputMode="numeric" error={ed.errors.updatedYear} />
        </FieldGrid>
      </Group>
      <Group title="Daily stack" defaultOpen={false}>
        <ListEditor<DailyItem>
          label="Tools"
          items={v.dailyStack}
          onChange={(x) => ed.set("dailyStack", reorder(x, "order") as never)}
          createItem={() => ({ id: `daily-${Date.now().toString(36)}`, name: "", description: "", category: "", icon: "code", enabled: true })}
          itemTitle={(t) => t.name}
          itemMeta={(t) => [t.category, t.enabled === false ? "hidden" : ""].filter(Boolean).join(" · ")}
          max={50}
          error={ed.errors.dailyStack}
          addLabel="Add tool"
          renderItem={(t, update) => (
            <>
              <FieldGrid cols={3}>
                <TextField label="Name" value={t.name} onChange={(x) => update({ name: x })} maxLength={80} />
                <TextField label="Category" value={t.category} onChange={(x) => update({ category: x })} maxLength={60} />
                <SelectField label="Icon" value={t.icon || ""} onChange={(x) => update({ icon: x })} options={ICON_OPTIONS} />
              </FieldGrid>
              <TextField label="Description" value={t.description} onChange={(x) => update({ description: x })} maxLength={400} />
              <Switch label="Shown on the page" checked={t.enabled !== false} onChange={(x) => update({ enabled: x })} />
            </>
          )}
        />
      </Group>
      <Group title="Development stack" defaultOpen={false}>
        <ListEditor<DevItem>
          label="Technologies"
          items={v.developmentStack}
          onChange={(x) => ed.set("developmentStack", reorder(x, "displayOrder") as never)}
          createItem={() => ({ name: "", description: "", category: "", icon: "layers", group: "Core Architecture", displayOrder: 0, enabled: true })}
          itemTitle={(t) => t.name}
          itemMeta={(t) => t.group || ""}
          max={30}
          error={ed.errors.developmentStack}
          addLabel="Add technology"
          renderItem={(t, update) => (
            <>
              <FieldGrid>
                <TextField label="Name" value={t.name} onChange={(x) => update({ name: x })} maxLength={60} />
                <TextField label="Group" value={t.group || ""} onChange={(x) => update({ group: x })} maxLength={60} />
                <TextField label="Category" value={t.category || ""} onChange={(x) => update({ category: x })} maxLength={50} />
                <SelectField label="Icon" value={t.icon || ""} onChange={(x) => update({ icon: x })} options={ICON_OPTIONS} />
              </FieldGrid>
              <TextField label="Description" value={t.description} onChange={(x) => update({ description: x })} maxLength={300} />
              <Switch label="Shown on the page" checked={t.enabled !== false} onChange={(x) => update({ enabled: x })} />
            </>
          )}
        />
      </Group>
      <Group title="How I build" defaultOpen={false}>
        <ListEditor<BuildStep>
          label="Steps"
          items={v.howIBuild}
          onChange={(x) => ed.set("howIBuild", reorder(x, "order") as never)}
          createItem={() => ({ title: "", description: "", enabled: true })}
          itemTitle={(t) => t.title}
          max={20}
          error={ed.errors.howIBuild}
          addLabel="Add step"
          renderItem={(t, update) => (
            <>
              <FieldGrid>
                <TextField label="Step label" value={t.step || ""} onChange={(x) => update({ step: x })} maxLength={10} placeholder="01" />
                <TextField label="Title" value={t.title} onChange={(x) => update({ title: x })} maxLength={80} />
              </FieldGrid>
              <TextField label="Description" value={t.description} onChange={(x) => update({ description: x })} multiline maxLength={400} />
              <Switch label="Shown on the page" checked={t.enabled !== false} onChange={(x) => update({ enabled: x })} />
            </>
          )}
        />
      </Group>
      <Group title="Currently exploring" defaultOpen={false}>
        <ListEditor<Exploring>
          label="Topics"
          items={v.currentlyExploring}
          onChange={(x) => ed.set("currentlyExploring", reorder(x, "displayOrder") as never)}
          createItem={() => ({ name: "", description: "", category: "", icon: "sparkles", displayOrder: 0 })}
          itemTitle={(t) => t.name}
          max={30}
          error={ed.errors.currentlyExploring}
          addLabel="Add topic"
          renderItem={(t, update) => (
            <>
              <FieldGrid cols={3}>
                <TextField label="Name" value={t.name} onChange={(x) => update({ name: x })} maxLength={60} />
                <TextField label="Category" value={t.category || ""} onChange={(x) => update({ category: x })} maxLength={50} />
                <SelectField label="Icon" value={t.icon || ""} onChange={(x) => update({ icon: x })} options={ICON_OPTIONS} />
              </FieldGrid>
              <TextField label="Description" value={t.description} onChange={(x) => update({ description: x })} maxLength={300} />
            </>
          )}
        />
      </Group>
      <Group title="My setup" defaultOpen={false}>
        {(["mainMachine", "fuel", "currentStatus"] as SetupKey[]).map((k) => (
          <FieldGrid key={k} cols={3}>
            <TextField label="Label" value={setup[k].label} onChange={(x) => ed.set("mySetup", { ...setup, [k]: { ...setup[k], label: x } } as never)} maxLength={60} />
            <TextField label="Value" value={setup[k].value} onChange={(x) => ed.set("mySetup", { ...setup, [k]: { ...setup[k], value: x } } as never)} maxLength={150} />
            <TextField label="Detail" value={setup[k].description} onChange={(x) => ed.set("mySetup", { ...setup, [k]: { ...setup[k], description: x } } as never)} maxLength={300} />
          </FieldGrid>
        ))}
      </Group>
    </EditorFrame>
  );
}

/* ------------------------------------------------------------------ Resume */

interface SkillGroup { [k: string]: unknown; id: string; title: string; skills: string[]; displayOrder: number }
interface Experience { [k: string]: unknown; id: string; role: string; organization: string; startDate: string; endDate: string; current: boolean; location?: string; bullets: string[]; displayOrder: number }
interface Education { [k: string]: unknown; id: string; degree: string; institution: string; location: string; startDate?: string; endDate?: string; description?: string; displayOrder: number }

const LABELS: [string, string][] = [
  ["pdfLabel", "Download button"],
  ["profileLabel", "Profile section"],
  ["skillsLabel", "Skills section"],
  ["experienceLabel", "Experience section"],
  ["educationLabel", "Education section"],
  ["ctaEyebrow", "Closing eyebrow"],
  ["indexLabel", "Contents heading"],
  ["statusLabel", "Status label"],
  ["roleLabel", "Role label"],
  ["locationLabel", "Location label"],
  ["sinceLabel", "Since label"],
];

export function ResumeEditor({ initial, pdf }: { initial: Record<string, unknown>; pdf: ResumePdf | null }) {
  const ed = useSectionEditor("resume", initial as EditorValues);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed section document
  const v = ed.values as Record<string, any>;
  const cta = v.cta as { heading: string; description: string; buttonText: string };
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/resume" changedCount={ed.changed.length}>
      <ResumePdfCard pdf={pdf} />
      <Group title="Profile" description="Status, email and location come from Settings → Availability and Contact.">
        <FieldGrid>
          <TextField label="Name" value={v.title} onChange={(x) => ed.set("title", x)} maxLength={120} error={ed.errors.title} />
          <TextField label="Headline" value={v.subtitle} onChange={(x) => ed.set("subtitle", x)} maxLength={200} error={ed.errors.subtitle} />
          <TextField label="Eyebrow" value={v.eyebrow} onChange={(x) => ed.set("eyebrow", x)} maxLength={60} error={ed.errors.eyebrow} />
          <TextField label="Website" type="url" inputMode="url" value={v.website} onChange={(x) => ed.set("website", x)} maxLength={200} error={ed.errors.website} />
        </FieldGrid>
        <TextField label="Summary" value={v.summary} onChange={(x) => ed.set("summary", x)} multiline rows={5} maxLength={2000} error={ed.errors.summary} />
      </Group>
      <Group title="Skills" defaultOpen={false}>
        <ListEditor<SkillGroup>
          label="Skill groups"
          items={v.skills}
          onChange={(x) => ed.set("skills", reorder(x, "displayOrder") as never)}
          createItem={() => ({ id: `group-${Date.now().toString(36)}`, title: "", skills: [], displayOrder: 0 })}
          itemTitle={(g) => g.title}
          itemMeta={(g) => g.skills.slice(0, 4).join(", ")}
          max={20}
          error={ed.errors.skills}
          addLabel="Add group"
          renderItem={(g, update) => (
            <>
              <TextField label="Group title" value={g.title} onChange={(x) => update({ title: x })} maxLength={60} />
              <StringListEditor label="Skills" items={g.skills} onChange={(x) => update({ skills: x })} max={30} maxLength={50} addLabel="Add skill" />
            </>
          )}
        />
      </Group>
      <Group title="Experience" defaultOpen={false}>
        <ListEditor<Experience>
          label="Roles"
          items={v.experience}
          onChange={(x) => ed.set("experience", reorder(x, "displayOrder") as never)}
          createItem={() => ({ id: `exp-${Date.now().toString(36)}`, role: "", organization: "", startDate: "", endDate: "", current: false, location: "", bullets: [], displayOrder: 0 })}
          itemTitle={(e) => e.role}
          itemMeta={(e) => [e.organization, `${e.startDate}${e.current ? " – Present" : e.endDate ? ` – ${e.endDate}` : ""}`].filter(Boolean).join(" · ")}
          max={20}
          error={ed.errors.experience}
          addLabel="Add role"
          renderItem={(e, update) => (
            <>
              <FieldGrid>
                <TextField label="Role" value={e.role} onChange={(x) => update({ role: x })} maxLength={80} />
                <TextField label="Organisation" value={e.organization} onChange={(x) => update({ organization: x })} maxLength={80} />
              </FieldGrid>
              <FieldGrid cols={3}>
                <TextField label="Start" value={e.startDate} onChange={(x) => update({ startDate: x })} maxLength={20} placeholder="2024" />
                <TextField label="End" value={e.endDate} onChange={(x) => update({ endDate: x })} maxLength={20} disabled={e.current} />
                <TextField label="Location" value={e.location || ""} onChange={(x) => update({ location: x })} maxLength={60} />
              </FieldGrid>
              <Switch label="Current role" checked={e.current} onChange={(x) => update({ current: x })} />
              <StringListEditor label="Highlights" items={e.bullets} onChange={(x) => update({ bullets: x })} max={10} maxLength={300} addLabel="Add highlight" />
            </>
          )}
        />
      </Group>
      <Group title="Education" defaultOpen={false}>
        <ListEditor<Education>
          label="Entries"
          items={v.education}
          onChange={(x) => ed.set("education", reorder(x, "displayOrder") as never)}
          createItem={() => ({ id: `edu-${Date.now().toString(36)}`, degree: "", institution: "", location: "", startDate: "", endDate: "", description: "", displayOrder: 0 })}
          itemTitle={(e) => e.degree}
          itemMeta={(e) => e.institution}
          max={10}
          error={ed.errors.education}
          addLabel="Add entry"
          renderItem={(e, update) => (
            <>
              <FieldGrid>
                <TextField label="Degree / programme" value={e.degree} onChange={(x) => update({ degree: x })} maxLength={100} />
                <TextField label="Institution" value={e.institution} onChange={(x) => update({ institution: x })} maxLength={100} />
              </FieldGrid>
              <FieldGrid cols={3}>
                <TextField label="Start" value={e.startDate || ""} onChange={(x) => update({ startDate: x })} maxLength={20} />
                <TextField label="End" value={e.endDate || ""} onChange={(x) => update({ endDate: x })} maxLength={20} />
                <TextField label="Location" value={e.location} onChange={(x) => update({ location: x })} maxLength={60} />
              </FieldGrid>
              <TextField label="Notes" value={e.description || ""} onChange={(x) => update({ description: x })} maxLength={300} />
            </>
          )}
        />
      </Group>
      <Group title="Closing call to action" defaultOpen={false}>
        <FieldGrid>
          <TextField label="Heading" value={cta.heading} onChange={(x) => ed.set("cta", { ...cta, heading: x })} maxLength={100} />
          <TextField label="Button" value={cta.buttonText} onChange={(x) => ed.set("cta", { ...cta, buttonText: x })} maxLength={40} />
        </FieldGrid>
        <TextField label="Description" value={cta.description} onChange={(x) => ed.set("cta", { ...cta, description: x })} maxLength={300} />
        <TextField label="Contact button" value={v.ctaText} onChange={(x) => ed.set("ctaText", x)} maxLength={60} error={ed.errors.ctaText} />
      </Group>
      <Group title="Page labels" description="Short interface words (up to 40 characters)." defaultOpen={false}>
        <FieldGrid cols={3}>
          {LABELS.map(([k, label]) => (
            <TextField key={k} label={label} value={v[k] ?? ""} onChange={(x) => ed.set(k, x)} maxLength={40} error={ed.errors[k]} />
          ))}
        </FieldGrid>
      </Group>
    </EditorFrame>
  );
}

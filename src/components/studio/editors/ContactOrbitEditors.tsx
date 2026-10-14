"use client";

import { FieldGrid, Group, Switch, TextField } from "../fields";
import { StringListEditor } from "../ListEditor";
import { useSectionEditor } from "../useSectionEditor";
import EditorFrame from "./EditorFrame";
import type { EditorValues } from "@/lib/cms/serialize";

/* ------------------------------------------------------------------ Contact & social */

export interface ContactValues extends EditorValues {
  eyebrow: string;
  title: string;
  description: string;
  email: string;
  phone: string;
  showPhoneNumber: boolean;
  location: string;
  responseTime: string;
  successTitle: string;
  successMessage: string;
  socials: { github: string; linkedin: string; twitter: string; instagram: string };
  form: { namePlaceholder: string; emailPlaceholder: string; phonePlaceholder: string; subjectPlaceholder: string; messagePlaceholder: string };
}

export function ContactEditor({ initial }: { initial: ContactValues }) {
  const ed = useSectionEditor("contact", initial);
  const v = ed.values;
  const social = (k: keyof ContactValues["socials"], x: string) => ed.set("socials", { ...v.socials, [k]: x });
  const form = (k: keyof ContactValues["form"], x: string) => ed.set("form", { ...v.form, [k]: x });
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/contact" changedCount={ed.changed.length}>
      <Group title="Contact details" description="The single source for email, location, phone and social links everywhere on the site and in Orbit.">
        <FieldGrid>
          <TextField label="Email" type="email" inputMode="email" value={v.email} onChange={(x) => ed.set("email", x)} error={ed.errors.email} maxLength={100} />
          <TextField label="Location" value={v.location} onChange={(x) => ed.set("location", x)} error={ed.errors.location} maxLength={120} />
          <TextField label="Phone" type="tel" inputMode="tel" value={v.phone} onChange={(x) => ed.set("phone", x)} error={ed.errors.phone} maxLength={40} />
          <TextField label="Reply time" value={v.responseTime} onChange={(x) => ed.set("responseTime", x)} error={ed.errors.responseTime} maxLength={80} hint="Shown beside the location when the phone is hidden." />
        </FieldGrid>
        <Switch
          label="Show phone number publicly"
          checked={v.showPhoneNumber}
          onChange={(x) => ed.set("showPhoneNumber", x)}
          hint="When off, the number is never sent to the browser or to Orbit."
        />
      </Group>
      <Group title="Social links" description="Full URLs, starting with https://. Empty links are hidden.">
        {ed.errors.socials && (
          <p role="alert" className="text-[12.5px] text-danger">
            {ed.errors.socials}
          </p>
        )}
        <FieldGrid>
          <TextField label="GitHub" type="url" inputMode="url" value={v.socials.github} onChange={(x) => social("github", x)} />
          <TextField label="LinkedIn" type="url" inputMode="url" value={v.socials.linkedin} onChange={(x) => social("linkedin", x)} />
          <TextField label="X / Twitter" type="url" inputMode="url" value={v.socials.twitter} onChange={(x) => social("twitter", x)} />
          <TextField label="Instagram" type="url" inputMode="url" value={v.socials.instagram} onChange={(x) => social("instagram", x)} />
        </FieldGrid>
      </Group>
      <Group title="Contact page" defaultOpen={false}>
        <FieldGrid>
          <TextField label="Eyebrow" value={v.eyebrow} onChange={(x) => ed.set("eyebrow", x)} maxLength={60} error={ed.errors.eyebrow} />
          <TextField label="Title" value={v.title} onChange={(x) => ed.set("title", x)} maxLength={120} error={ed.errors.title} />
        </FieldGrid>
        <TextField label="Introduction" value={v.description} onChange={(x) => ed.set("description", x)} multiline maxLength={500} error={ed.errors.description} />
        <FieldGrid>
          <TextField label="Success title" value={v.successTitle} onChange={(x) => ed.set("successTitle", x)} maxLength={120} error={ed.errors.successTitle} />
          <TextField label="Success message" value={v.successMessage} onChange={(x) => ed.set("successMessage", x)} maxLength={300} error={ed.errors.successMessage} />
        </FieldGrid>
      </Group>
      <Group title="Form placeholders" defaultOpen={false}>
        <FieldGrid>
          <TextField label="Name" value={v.form.namePlaceholder} onChange={(x) => form("namePlaceholder", x)} maxLength={150} />
          <TextField label="Email" value={v.form.emailPlaceholder} onChange={(x) => form("emailPlaceholder", x)} maxLength={150} />
          <TextField label="Phone" value={v.form.phonePlaceholder} onChange={(x) => form("phonePlaceholder", x)} maxLength={150} />
          <TextField label="Subject" value={v.form.subjectPlaceholder} onChange={(x) => form("subjectPlaceholder", x)} maxLength={150} />
        </FieldGrid>
        <TextField label="Message" value={v.form.messagePlaceholder} onChange={(x) => form("messagePlaceholder", x)} maxLength={150} />
      </Group>
    </EditorFrame>
  );
}

/* ------------------------------------------------------------------ Orbit (ai) */

export interface OrbitValues extends EditorValues {
  title: string;
  greetingMessage: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingLateNight: string;
  welcomeMessages: string[];
  desktopComposerPlaceholder: string;
  mobileComposerPlaceholder: string;
  disclaimer: string;
  voiceInput: boolean;
  voicePlayback: boolean;
  fileAttachments: boolean;
  serverTranscription: boolean;
}

export function OrbitEditor({ initial }: { initial: OrbitValues }) {
  const ed = useSectionEditor("ai", initial);
  const v = ed.values;
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/ai" changedCount={ed.changed.length}>
      <Group title="Welcome" description="What a visitor sees before the first question.">
        <FieldGrid>
          <TextField label="Name" value={v.title} onChange={(x) => ed.set("title", x)} maxLength={60} error={ed.errors.title} />
          <TextField label="Tagline (below “Ask Orbit”)" value={v.greetingMessage} onChange={(x) => ed.set("greetingMessage", x)} maxLength={160} error={ed.errors.greetingMessage} />
        </FieldGrid>
        <FieldGrid>
          <TextField label="Morning greeting" value={v.greetingMorning} onChange={(x) => ed.set("greetingMorning", x)} maxLength={80} hint="05:00 to 11:59, visitor's own clock" error={ed.errors.greetingMorning} />
          <TextField label="Afternoon greeting" value={v.greetingAfternoon} onChange={(x) => ed.set("greetingAfternoon", x)} maxLength={80} hint="12:00 to 16:59" error={ed.errors.greetingAfternoon} />
          <TextField label="Evening greeting" value={v.greetingEvening} onChange={(x) => ed.set("greetingEvening", x)} maxLength={80} hint="17:00 to 21:59" error={ed.errors.greetingEvening} />
          <TextField label="Late-night greeting" value={v.greetingLateNight} onChange={(x) => ed.set("greetingLateNight", x)} maxLength={80} hint="22:00 to 04:59" error={ed.errors.greetingLateNight} />
        </FieldGrid>
        <StringListEditor
          label="Welcome messages"
          items={v.welcomeMessages}
          onChange={(x) => ed.set("welcomeMessages", x)}
          max={60}
          maxLength={70}
          error={ed.errors.welcomeMessages}
          hint="One is drawn at random on each visit, after the greeting. Avoid times of day."
          addLabel="Add message"
        />
      </Group>
      <Group title="Composer" defaultOpen={false}>
        <FieldGrid>
          <TextField label="Placeholder on desktop" value={v.desktopComposerPlaceholder} onChange={(x) => ed.set("desktopComposerPlaceholder", x)} maxLength={80} error={ed.errors.desktopComposerPlaceholder} />
          <TextField label="Placeholder on phones" value={v.mobileComposerPlaceholder} onChange={(x) => ed.set("mobileComposerPlaceholder", x)} maxLength={80} error={ed.errors.mobileComposerPlaceholder} />
        </FieldGrid>
        <TextField label="Note under the composer" value={v.disclaimer} onChange={(x) => ed.set("disclaimer", x)} maxLength={160} error={ed.errors.disclaimer} />
      </Group>
      <Group title="Capabilities" description="Each is enforced by the server as well as hidden in the interface.">
        <Switch label="Voice input" checked={v.voiceInput} onChange={(x) => ed.set("voiceInput", x)} hint="Dictation with the browser's speech recognition." />
        <Switch label="Spoken replies" checked={v.voicePlayback} onChange={(x) => ed.set("voicePlayback", x)} hint="Replies read aloud with the device's voices." />
        <Switch label="Server transcription" checked={v.serverTranscription} onChange={(x) => ed.set("serverTranscription", x)} hint="Where the browser has no dictation, short recordings are transcribed by Workers AI." />
        <Switch label="File & photo attachments" checked={v.fileAttachments} onChange={(x) => ed.set("fileAttachments", x)} hint="Visitors can attach documents and photos (processed by Workers AI, deleted after an hour)." />
      </Group>
    </EditorFrame>
  );
}

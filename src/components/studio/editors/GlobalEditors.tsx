"use client";

import { FieldGrid, Group, Segmented, TextField } from "../fields";
import { useSectionEditor } from "../useSectionEditor";
import EditorFrame from "./EditorFrame";
import { SEO_FALLBACKS, SEO_LIMITS, SEO_PAGES, type SeoContent, type SeoPageKey } from "@/lib/cms/fields";

/* ------------------------------------------------------------------ Identity (global) */

export interface IdentityValues {
  [key: string]: string;
  brandName: string;
  siteTitle: string;
  shortBio: string;
  headerBrand: "wordmark" | "logo";
}

export function IdentityEditor({ initial }: { initial: IdentityValues }) {
  const ed = useSectionEditor("global", initial);
  const v = ed.values;
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/" changedCount={ed.changed.length}>
      <Group title="Site identity" description="Used in the browser tab, search results and link previews.">
        <FieldGrid>
          <TextField label="Brand name" value={v.brandName} onChange={(x) => ed.set("brandName", x)} maxLength={60} error={ed.errors.brandName} />
          <TextField label="Site title" value={v.siteTitle} onChange={(x) => ed.set("siteTitle", x)} maxLength={120} error={ed.errors.siteTitle} hint="The homepage title when no SEO override is set." />
        </FieldGrid>
        <TextField label="Short bio" value={v.shortBio} onChange={(x) => ed.set("shortBio", x)} multiline maxLength={300} error={ed.errors.shortBio} hint="Default description for the site and Orbit's summary of you." />
      </Group>
      <Group title="Header brand">
        <Segmented
          label="Show in the site header"
          value={v.headerBrand}
          onChange={(x) => ed.set("headerBrand", x)}
          options={[
            { value: "wordmark", label: "Typographic wordmark" },
            { value: "logo", label: "Logo images" },
          ]}
          hint="Logo images are managed in Media & Identity (one per theme)."
        />
      </Group>
    </EditorFrame>
  );
}

/* ------------------------------------------------------------------ Footer & shared (global) */

export interface FooterValues {
  [key: string]: string;
  footerCopyright: string;
  footerBulletNotification: string;
  footerClosingLabel: string;
  closingInvite: string;
  closingPrompt: string;
  closingCta: string;
}

export function FooterEditor({ initial }: { initial: FooterValues }) {
  const ed = useSectionEditor("global", initial);
  const v = ed.values;
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} viewHref="/projects" changedCount={ed.changed.length}>
      <Group title="Closing scene" description="The invitation above the footer on index pages.">
        <TextField
          label="Invitation"
          value={v.closingInvite}
          onChange={(x) => ed.set("closingInvite", x)}
          maxLength={120}
          error={ed.errors.closingInvite}
          hint="Wrap one word in *asterisks* to set it in accent italics. On phones the line breaks before that word."
        />
        <FieldGrid cols={3}>
          <TextField label="Label" value={v.footerClosingLabel} onChange={(x) => ed.set("footerClosingLabel", x)} maxLength={40} error={ed.errors.footerClosingLabel} />
          <TextField label="Above the email" value={v.closingPrompt} onChange={(x) => ed.set("closingPrompt", x)} maxLength={40} error={ed.errors.closingPrompt} />
          <TextField label="Button" value={v.closingCta} onChange={(x) => ed.set("closingCta", x)} maxLength={40} error={ed.errors.closingCta} />
        </FieldGrid>
      </Group>
      <Group title="Footer">
        <TextField label="Copyright line" value={v.footerCopyright} onChange={(x) => ed.set("footerCopyright", x)} maxLength={300} error={ed.errors.footerCopyright} />
        <TextField
          label="Ticker phrases"
          value={v.footerBulletNotification}
          onChange={(x) => ed.set("footerBulletNotification", x)}
          maxLength={300}
          error={ed.errors.footerBulletNotification}
          hint="Separate phrases with • (shown as a moving line on phones)."
        />
      </Group>
    </EditorFrame>
  );
}

/* ------------------------------------------------------------------ SEO (seo) */

export function SeoEditor({ initial }: { initial: SeoContent }) {
  const ed = useSectionEditor("seo", initial as unknown as Record<string, { title: string; description: string }>);
  const v = ed.values as unknown as SeoContent;
  const update = (key: SeoPageKey, patch: Partial<{ title: string; description: string }>) =>
    ed.set(key, { ...v[key], ...patch } as never);
  return (
    <EditorFrame state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} changedCount={ed.changed.length}>
      {SEO_PAGES.map((page) => {
        const fallback = SEO_FALLBACKS[page.key];
        return (
          <Group key={page.key} title={page.label} description={page.path} defaultOpen={false} badge={v[page.key].title || v[page.key].description ? <span className="label-mono text-accent">custom</span> : undefined}>
            {ed.errors[page.key] && (
              <p role="alert" className="text-[12.5px] text-danger">
                {ed.errors[page.key]}
              </p>
            )}
            <TextField
              label="Title"
              value={v[page.key].title}
              onChange={(x) => update(page.key, { title: x })}
              maxLength={SEO_LIMITS.title}
              placeholder={fallback.title || "Site title"}
              hint="Empty uses the wording shown as placeholder."
            />
            <TextField
              label="Description"
              value={v[page.key].description}
              onChange={(x) => update(page.key, { description: x })}
              maxLength={SEO_LIMITS.description}
              multiline
              rows={2}
              placeholder={fallback.description || "Short bio"}
            />
          </Group>
        );
      })}
    </EditorFrame>
  );
}

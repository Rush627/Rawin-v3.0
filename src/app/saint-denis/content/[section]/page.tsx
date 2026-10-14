import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContentFresh, type SiteContent } from "@/lib/site-content";
import StudioHeader from "@/components/studio/StudioHeader";
import { IdentityEditor, FooterEditor, SeoEditor } from "@/components/studio/editors/GlobalEditors";
import { ContactEditor, OrbitEditor } from "@/components/studio/editors/ContactOrbitEditors";
import { HomeEditor, AboutEditor } from "@/components/studio/editors/HomeAboutEditors";
import { UsesEditor, ResumeEditor } from "@/components/studio/editors/UsesResumeEditors";
import { CONTENT_SECTIONS, type ContentSlug } from "../sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const s = CONTENT_SECTIONS.find((x) => x.slug === section);
  return { title: `${s?.title ?? "Content"} | RAWIN Studio` };
}

/**
 * One editor per page. Each receives exactly the stored fields it edits (read uncached, so
 * it starts from the database rather than the public cache) and saves only what changes.
 */
export default async function ContentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const meta = CONTENT_SECTIONS.find((x) => x.slug === section);
  if (!meta) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/saint-denis/login?redirect=/saint-denis/content/${section}`);

  const content = await getSiteContentFresh();

  return (
    <div>
      <StudioHeader back={{ href: "/saint-denis/content", label: "Site Content" }} title={meta.title} description={meta.description} />
      {renderEditor(meta.slug, content)}
    </div>
  );
}

function renderEditor(slug: ContentSlug, c: SiteContent) {
  const g = c.global;
  switch (slug) {
    case "identity":
      return <IdentityEditor initial={{ brandName: g.brandName, siteTitle: g.siteTitle, shortBio: g.shortBio, headerBrand: g.headerBrand === "logo" ? "logo" : "wordmark" }} />;
    case "footer":
      return (
        <FooterEditor
          initial={{
            footerCopyright: g.footerCopyright || "",
            footerBulletNotification: g.footerBulletNotification || "",
            footerClosingLabel: g.footerClosingLabel || "",
            closingInvite: g.closingInvite || "",
            closingPrompt: g.closingPrompt || "",
            closingCta: g.closingCta || "",
          }}
        />
      );
    case "seo":
      return <SeoEditor initial={c.seo} />;
    case "home": {
      const h = c.home;
      return (
        <HomeEditor
          initial={{
            heroTitlePrefix: h.heroTitlePrefix,
            heroName: h.heroName,
            heroBio: h.heroBio,
            heroPrimaryCtaText: h.heroPrimaryCtaText,
            heroSecondaryCtaText: h.heroSecondaryCtaText,
            heroTypingPhrases: h.heroTypingPhrases ?? [],
            featuredHeading: h.featuredHeading,
            featuredDescription: h.featuredDescription ?? "",
            showHeroFocus: h.showHeroFocus !== false,
            showHeroAvailability: h.showHeroAvailability !== false,
            showHeroWork: h.showHeroWork !== false,
            showCapabilities: h.showCapabilities !== false,
            showValues: h.showValues !== false,
            showJourney: h.showJourney !== false,
            capabilities: h.capabilities,
            values: h.values,
          }}
        />
      );
    }
    case "about": {
      const a = c.about;
      const { evolution, principles, focusAreas, journey, milestoneLabels, ...text } = a;
      return (
        <AboutEditor
          initial={{
            ...Object.fromEntries(Object.entries(text).map(([k, v]) => [k, typeof v === "string" ? v : ""])),
            evolution: evolution.map((m) => ({ ...m, url: m.url ?? "", previewAlt: m.previewAlt ?? "" })),
            principles,
            focusAreas,
            journey,
            milestoneLabels: {
              milestone01: milestoneLabels?.milestone01 ?? "",
              milestone02: milestoneLabels?.milestone02 ?? "",
              milestone03: milestoneLabels?.milestone03 ?? "",
              currentEra: milestoneLabels?.currentEra ?? "",
            },
          }}
        />
      );
    }
    case "uses": {
      const u = c.uses;
      return (
        <UsesEditor
          initial={{
            eyebrow: u.eyebrow,
            title: u.title,
            description: u.description,
            ledgerLabel: u.ledgerLabel ?? "",
            updateLabel: u.updateLabel ?? "",
            updatedYear: u.updatedYear,
            dailyStack: u.dailyStack,
            developmentStack: u.developmentStack,
            howIBuild: u.howIBuild,
            currentlyExploring: u.currentlyExploring,
            mySetup: u.mySetup,
          }}
        />
      );
    }
    case "resume": {
      const r = c.resume;
      return (
        <ResumeEditor
          pdf={r.pdf ? { filename: r.pdf.filename, url: r.pdf.url, size: r.pdf.size, updatedAt: r.pdf.updatedAt } : null}
          initial={{
            eyebrow: r.eyebrow,
            title: r.title,
            subtitle: r.subtitle,
            summary: r.summary,
            ctaText: r.ctaText,
            website: r.contact?.website ?? "",
            pdfLabel: r.pdfLabel,
            profileLabel: r.profileLabel,
            skillsLabel: r.skillsLabel,
            experienceLabel: r.experienceLabel,
            educationLabel: r.educationLabel,
            ctaEyebrow: r.ctaEyebrow,
            indexLabel: r.indexLabel,
            statusLabel: r.statusLabel,
            roleLabel: r.roleLabel,
            locationLabel: r.locationLabel,
            sinceLabel: r.sinceLabel,
            skills: r.skills,
            experience: r.experience.map((e) => ({ ...e, location: e.location ?? "" })),
            education: r.education,
            cta: r.cta,
          }}
        />
      );
    }
    case "contact": {
      const k = c.contact;
      return (
        <ContactEditor
          initial={{
            eyebrow: k.eyebrow,
            title: k.title,
            description: k.description,
            email: k.email,
            phone: k.phone,
            showPhoneNumber: k.showPhoneNumber,
            location: k.location,
            responseTime: k.responseTime,
            successTitle: k.successTitle,
            successMessage: k.successMessage,
            socials: { github: k.socials.github || "", linkedin: k.socials.linkedin || "", twitter: k.socials.twitter || "", instagram: k.socials.instagram || "" },
            form: k.form,
          }}
        />
      );
    }
    case "orbit": {
      const ai = c.ai;
      return (
        <OrbitEditor
          initial={{
            title: ai.title,
            greetingMessage: ai.greetingMessage,
            greetingMorning: ai.greetingMorning,
            greetingAfternoon: ai.greetingAfternoon,
            greetingEvening: ai.greetingEvening,
            greetingLateNight: ai.greetingLateNight,
            welcomeMessages: ai.welcomeMessages,
            desktopComposerPlaceholder: ai.desktopComposerPlaceholder ?? "",
            mobileComposerPlaceholder: ai.mobileComposerPlaceholder ?? "",
            disclaimer: ai.disclaimer,
            voiceInput: ai.voiceInput !== false,
            voicePlayback: ai.voicePlayback !== false,
            fileAttachments: ai.fileAttachments === true,
            serverTranscription: ai.serverTranscription === true,
          }}
        />
      );
    }
  }
}

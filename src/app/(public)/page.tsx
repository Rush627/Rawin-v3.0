import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Hero from "@/components/home/Hero";
import WorkIndex from "@/components/home/WorkIndex";
import Capabilities from "@/components/home/Capabilities";
import Principles from "@/components/home/Principles";
import Chronology from "@/components/home/Chronology";
import SectionHead from "@/components/system/SectionHead";
import LaunchExperience from "@/components/launch/LaunchExperience";
import OrbitInvite from "@/components/home/OrbitInvite";
import { getFeaturedProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/site-content";
import { AVAILABILITY_TONE, journeyForDisplay, seoFor, valuesForDisplay } from "@/lib/cms/fields";
import { SITE_URL } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const seo = seoFor(content.seo, "home", { title: content.global.siteTitle, description: content.global.shortBio });
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/" },
    openGraph: { title: seo.title, description: seo.description, url: SITE_URL },
  };
}

/** Render a CMS heading with its last word set in italic for editorial emphasis. */
function emphasiseLast(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return [<em key="e" className="italic">{text}</em>];
  const last = words.pop();
  return [
    <span key="l0">{words.join(" ")}</span>,
    <em key="e" className="italic text-accent">
      {last}
    </em>,
  ];
}

export default async function HomePage() {
  const [featuredProjects, siteContent] = await Promise.all([getFeaturedProjects(), getSiteContent()]);
  const home = siteContent.home;
  const projects = featuredProjects ?? [];

  return (
    <>
      <LaunchExperience launch={siteContent.launchExperience} />

      <Hero
        prefix={home.heroTitlePrefix}
        name={home.heroName}
        bio={home.heroBio}
        status={siteContent.availability.label}
        badge={siteContent.availability.note}
        statusColor={AVAILABILITY_TONE[siteContent.availability.state]}
        primaryCta={home.heroPrimaryCtaText}
        secondaryCta={home.heroSecondaryCtaText}
        phrases={home.heroTypingPhrases}
        location={siteContent.contact.location}
        featured={
          projects[0]
            ? { title: projects[0].shortName || projects[0].title, slug: projects[0].slug, category: projects[0].category, year: projects[0].year }
            : null
        }
        panels={{ focus: home.showHeroFocus !== false, availability: home.showHeroAvailability !== false, work: home.showHeroWork !== false }}
        portrait={{
          url: siteContent.assets.profilePhoto.url,
          alt: siteContent.assets?.profilePhoto?.alt || "Rushan Siddiqui : Full Stack Developer",
        }}
      />

      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 flex flex-col gap-28 sm:gap-36 lg:gap-44 pt-16 sm:pt-24">
        {/* 01 — Selected work */}
        <section id="selected-work" aria-labelledby="selected-work-title" className="scroll-mt-24">
          <SectionHead
            id="selected-work-title"
            index="01"
            eyebrow={home.featuredDescription || "Selected Work"}
            title={emphasiseLast(home.featuredHeading)}
            oneLineOnPhone={home.featuredHeading}
            aside={
              <Link href="/projects" className="group inline-flex items-center gap-2 text-fg">
                <span className="link-draw">View the full index</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </Link>
            }
            className="mb-12 sm:mb-16"
          />
          <WorkIndex projects={projects} />
        </section>

        {/* 02 — Capabilities */}
        {home.showCapabilities !== false && (
          <section aria-labelledby="capabilities-title">
            <SectionHead
              id="capabilities-title"
              index="02"
              eyebrow="Technical Skills"
              title={[<span key="l1">The working</span>, <em key="e" className="italic text-accent">toolkit</em>]}
              oneLineOnPhone="The working toolkit"
              aside="Technologies and tools I use to build full-stack web applications and user interfaces."
              className="mb-12 sm:mb-16"
            />
            <Capabilities categories={home.capabilities} />
          </section>
        )}

        {/* 03 — Principles */}
        {home.showValues !== false && (
          <section aria-labelledby="values-title">
            <SectionHead
              id="values-title"
              index="03"
              eyebrow="Value & Background"
              title={[<span key="l2">Why work</span>, <em key="e" className="italic text-accent">with me</em>]}
              oneLineOnPhone="Why work with me"
              aside="A combination of product-minded engineering, aesthetic discipline, and dependable execution."
              className="mb-12 sm:mb-16"
            />
            <Principles items={valuesForDisplay(home.values)} />
          </section>
        )}

        {/* 04 — Journey */}
        {home.showJourney !== false && (
          <section aria-labelledby="journey-title">
            <SectionHead
              id="journey-title"
              index="04"
              eyebrow="Engineering Journey"
              title={[<span key="l3">A record of</span>, <em key="e" className="italic text-accent">practice</em>]}
              oneLineOnPhone="A record of practice"
              className="mb-6 sm:mb-10"
            />
            <Chronology items={journeyForDisplay(siteContent.about.journey)} />
          </section>
        )}

        {/* 05 — Orbit */}
        <OrbitInvite
          title={siteContent.ai?.title || "Rawin Orbit"}
          greeting={siteContent.ai?.greetingMessage}
          disclaimer={siteContent.ai?.disclaimer}
          greetings={siteContent.ai}
          welcomeMessages={siteContent.ai?.welcomeMessages}
        />
      </div>
    </>
  );
}

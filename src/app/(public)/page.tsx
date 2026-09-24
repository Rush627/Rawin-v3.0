import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ExternalLink,
  Terminal,
  Cpu,
  Layers,
  Check,
  Send,
  Zap,
} from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import HeroRoleTyping from "@/components/HeroRoleTyping";
import MobileHero from "@/components/MobileHero";
import LaptopShowcase from "@/components/LaptopShowcase";
import BorderGlow from "@/components/BorderGlow";
import SelectedProjectsDeck from "@/components/SelectedProjectsDeck";
import MobileSelectedProjects from "@/components/MobileSelectedProjects";
import MobileTechStack from "@/components/MobileTechStack";
import MobileWhyWorkWithMe from "@/components/MobileWhyWorkWithMe";
import MobileEngineeringJourney from "@/components/MobileEngineeringJourney";
import { getFeaturedProjects } from "@/lib/projects";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";
import { TECH_ARSENAL } from "@/data/techArsenal";
import { TIMELINE, VALUE_PROPOSITIONS } from "@/data/experience";
import LaunchExperience from "@/components/launch/LaunchExperience";

export const revalidate = 3600;

export default async function HomePage() {
  const [featuredProjects, siteContent] = await Promise.all([
    getFeaturedProjects(),
    getSiteContent(),
  ]);
  const homeContent = siteContent.home;
  const globalContent = siteContent.global;

  const availabilityStatus =
    homeContent.heroStatus?.trim() || DEFAULT_SITE_CONTENT.home.heroStatus;
  const availabilityBadge =
    homeContent.heroBadge?.trim() || DEFAULT_SITE_CONTENT.home.heroBadge;
  const statusColor =
    homeContent.heroStatusColor || "green";

  const dotColorClass =
    statusColor === "red"
      ? "bg-rose-500"
      : statusColor === "orange"
      ? "bg-amber-500"
      : "bg-emerald-500";

  const pingColorClass =
    statusColor === "red"
      ? "bg-rose-400"
      : statusColor === "orange"
      ? "bg-amber-400"
      : "bg-emerald-400";

  return (
    <>
      <LaunchExperience launch={siteContent.launchExperience} />
      <div className="w-full flex flex-col gap-24 sm:gap-28 md:gap-36 pt-28 sm:pt-32 md:pt-36 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HERO                                               */}
      {/* ------------------------------------------------------------- */}
      {/* Desktop Hero (>=1024px) - 100% UNTOUCHED */}
      <div className="hidden lg:block w-full">
        <section className="relative flex flex-col items-center text-center pt-8 sm:pt-10 md:pt-4 lg:pt-1 pb-6 overflow-hidden">
          {/* Subtle Background Glow Accent (GPU friendly, zero lag) */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[340px] md:w-[600px] h-[280px] sm:h-[340px] md:h-[600px] max-w-full rounded-full bg-pacific-cyan/10 blur-[120px] pointer-events-none -z-10"
          />

          {/* Status Pill Badge - Extra-compact on narrow mobile, centered, single-line */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-medium glass-pill text-muted mb-5 sm:mb-8 border border-white/10 shadow-md whitespace-nowrap max-w-[92vw] overflow-hidden text-ellipsis">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColorClass} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${dotColorClass}`}></span>
            </span>
            <span className="truncate">{availabilityStatus}</span>
            <span className="text-white/20 shrink-0">•</span>
            <span className="text-pacific-cyan font-semibold shrink-0">{availabilityBadge}</span>
          </div>

          {/* Medium-sized Integrated Portrait */}
          <div data-particle-protected className="relative mb-6 sm:mb-8 group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pacific-cyan/40 via-apricot-cream/30 to-pacific-cyan/40 blur-md opacity-60 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-pacific-cyan/50 p-1 bg-surface/80 shadow-2xl">
              <Image
                src={siteContent.assets?.profilePhoto?.url || "/images/profile.png"}
                alt={siteContent.assets?.profilePhoto?.alt || "Rushan Siddiqui : Full Stack Developer"}
                width={128}
                height={128}
                priority
                unoptimized
                className="w-full h-full object-cover rounded-full filter contrast-105"
              />
            </div>
          </div>

          {/* Large Confident Typography with Role Typing Animation */}
          <div data-particle-protected className="flex flex-col items-center gap-2 max-w-4xl">
            <h1 className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground font-space leading-[1.08]">
              {homeContent.heroTitlePrefix}{" "}
              <span className="text-pacific-cyan" id="hero-name">
                {homeContent.heroName}
              </span>
            </h1>
            <HeroRoleTyping phrases={homeContent.heroTypingPhrases} />
          </div>

          {/* Bio statement - comfortably breathes on sides on mobile */}
          <p data-particle-protected className="mt-3.5 sm:mt-6 w-[86%] sm:w-auto max-w-xl text-xs sm:text-base md:text-lg text-muted leading-relaxed font-sans mx-auto">
            {homeContent.heroBio}
          </p>

          {/* Primary CTAs - compact on mobile, full touch accessibility */}
          <div data-particle-protected className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 mt-5 sm:mt-8 w-full max-w-[280px] sm:max-w-none mx-auto">
            <Link
              href="/projects"
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-3.5 sm:px-6 py-2 sm:py-3.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs sm:text-sm hover:bg-pacific-cyan/90 transition-all duration-200 shadow-[0_0_25px_rgba(24,155,173,0.35)] hover:shadow-[0_0_35px_rgba(24,155,173,0.5)] transform hover:-translate-y-0.5 text-center min-h-[38px] sm:min-h-[44px]"
            >
              <span>{homeContent.heroPrimaryCtaText}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-3.5 sm:px-6 py-2 sm:py-3.5 rounded-xl glass-card text-foreground font-medium text-xs sm:text-sm hover:border-pacific-cyan/40 transition-all duration-200 text-center min-h-[38px] sm:min-h-[44px]"
            >
              <span>{homeContent.heroSecondaryCtaText}</span>
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pacific-cyan shrink-0" />
            </Link>
          </div>

          {/* Quick Highlights Strip */}
          <div
            data-particle-protected
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-16 pt-8 border-t border-white/[0.06] w-full max-w-3xl"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold text-foreground font-space">Next.js</span>
              <span className="text-xs text-muted/70 font-mono uppercase mt-1">&amp; React</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold text-pacific-cyan font-space">Full Stack</span>
              <span className="text-xs text-muted/70 font-mono uppercase mt-1">Development</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold text-apricot-cream font-space">Modern</span>
              <span className="text-xs text-muted/70 font-mono uppercase mt-1">Web Systems</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold text-foreground font-space">Interaction</span>
              <span className="text-xs text-muted/70 font-mono uppercase mt-1">&amp; Motion</span>
            </div>
          </div>
        </section>
      </div>

      {/* Smartphone Hero (<1024px) - Clean, dedicated zero-JS mobile architecture */}
      <div className="block lg:hidden w-full">
        <MobileHero homeContent={homeContent} globalContent={globalContent} assets={siteContent.assets} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: FEATURED PROJECTS (Case Studies)                  */}
      {/* ------------------------------------------------------------- */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
              {homeContent.featuredHeading}
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-pacific-cyan hover:text-pacific-cyan/80 font-medium transition-colors"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Project Case Studies: Desktop Deck (>=1024px) vs Mobile/Tablet Flow (<1024px) */}
        <div className="hidden lg:block w-full">
          <SelectedProjectsDeck projects={featuredProjects ?? []} />
        </div>
        <div className="block lg:hidden w-full">
          <MobileSelectedProjects projects={featuredProjects ?? []} />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2.5: SCROLL-DRIVEN LAPTOP SHOWCASE                   */}
      {/* ------------------------------------------------------------- */}
      <LaptopShowcase />

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: TECH ARSENAL (Optimized, GPU Friendly)            */}
      {/* ------------------------------------------------------------- */}
      <section className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2 text-pacific-cyan font-mono text-xs uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4" />
            <span>Technical Skills</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            Tech Stack
          </h2>
          <p className="text-sm sm:text-base text-muted mt-2 max-w-2xl">
            Technologies and tools I use to build full-stack web applications and user interfaces.
          </p>
        </div>

        {/* Desktop 4 Category Grid (>=1024px) */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-6">
          {TECH_ARSENAL.map((category) => (
            <div
              key={category.title}
              data-particle-protected
              className="glass-card rounded-2xl p-6 sm:p-7 border border-white/[0.06] hover:border-pacific-cyan/30 flex flex-col gap-5 h-full"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground font-space">{category.title}</h3>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                  {category.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted/80">{category.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      item.highlight
                        ? "bg-surface/80 border-pacific-cyan/25"
                        : "bg-ink-black/40 border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground font-space truncate">{item.name}</span>
                      <span className="text-[10px] font-mono text-pacific-cyan shrink-0">{item.level}</span>
                    </div>
                    <p className="text-[11px] text-muted/70 mt-1 leading-snug line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile & Tablet Tech Stack Presentation (<1024px) */}
        <div className="block lg:hidden w-full">
          <MobileTechStack categories={TECH_ARSENAL} />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: EXPERIENCE / WHY WORK WITH ME                     */}
      {/* ------------------------------------------------------------- */}
      <section className="flex flex-col gap-12">
        <div>
          <div className="flex items-center gap-2 text-pacific-cyan font-mono text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Value &amp; Background</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            Why Work With Me
          </h2>
          <p className="text-sm sm:text-base text-muted mt-2 max-w-2xl">
            A combination of product-minded engineering, aesthetic discipline, and dependable execution.
          </p>
        </div>

        {/* Desktop 4 Value Proposition Cards (>=1024px) */}
        <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_PROPOSITIONS.map((prop) => (
            <BorderGlow key={prop.title} borderRadius={16} className="h-full">
              <div
                data-particle-protected
                className="glass-card rounded-2xl p-6 border border-white/[0.06] flex flex-col justify-between gap-4 h-full"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-pacific-cyan block mb-2">{prop.metric}</span>
                  <h4 className="text-lg font-bold text-foreground font-space">{prop.title}</h4>
                  <p className="text-xs text-apricot-cream/90 font-mono mt-0.5">{prop.tagline}</p>
                  <p className="text-xs text-muted mt-3 leading-relaxed">{prop.description}</p>
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>

        {/* Mobile & Tablet Why Work With Me Progression (<1024px) */}
        <div className="block lg:hidden w-full">
          <MobileWhyWorkWithMe propositions={VALUE_PROPOSITIONS} />
        </div>

        {/* Desktop Engineering Journey Timeline (>=1024px) */}
        <div data-particle-protected className="hidden lg:block glass-panel rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.06]">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground font-space mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-pacific-cyan" />
            <span>Engineering Journey</span>
          </h3>

          <div className="flex flex-col gap-8 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-[2px] before:bg-white/[0.08]">
            {TIMELINE.map((item) => (
              <div key={item.period} className="relative pl-10">
                {/* Timeline node */}
                <div className="absolute left-[9px] top-1.5 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan shadow-[0_0_8px_rgba(24,155,173,0.5)]"></div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-pacific-cyan">{item.period}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-xs text-muted font-mono">{item.companyOrContext}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-foreground font-space">{item.role}</h4>
                  <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed max-w-2xl">{item.description}</p>

                  <ul className="flex flex-col gap-2 mt-3">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs text-muted/85 group/item">
                        <span className="flex items-center justify-center w-4 h-4 rounded-[5px] bg-pacific-cyan/10 border border-pacific-cyan/25 text-pacific-cyan shrink-0 shadow-[0_0_8px_rgba(24,155,173,0.12)] group-hover/item:border-pacific-cyan/50 group-hover/item:bg-pacific-cyan/15 transition-all">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet Engineering Journey Timeline (<1024px) */}
        <div className="block lg:hidden w-full">
          <MobileEngineeringJourney items={TIMELINE} />
        </div>
      </section>
    </div>
    </>
  );
}


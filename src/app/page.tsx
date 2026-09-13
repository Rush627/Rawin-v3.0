import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Check,
  Send,
  Zap,
} from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import HeroRoleTyping from "@/components/HeroRoleTyping";
import LaptopShowcase from "@/components/LaptopShowcase";
import BorderGlow from "@/components/BorderGlow";
import { getFeaturedProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/site-content";
import { TECH_ARSENAL } from "@/data/techArsenal";
import { TIMELINE, VALUE_PROPOSITIONS } from "@/data/experience";

export const revalidate = 0;

export default async function HomePage() {
  const [featuredProjects, siteContent] = await Promise.all([
    getFeaturedProjects(),
    getSiteContent(),
  ]);
  const homeContent = siteContent.home;
  const contactEmail = siteContent.contact?.email || siteContent.global.contactEmail || "rushansiddiqui5262@gmail.com";

  return (
    <div className="w-full flex flex-col gap-28 md:gap-36 pt-28 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HERO                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative flex flex-col items-center text-center pt-8 md:pt-16 pb-6 overflow-hidden">
        {/* Subtle Background Glow Accent (GPU friendly, zero lag) */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[340px] md:w-[600px] h-[280px] sm:h-[340px] md:h-[600px] max-w-full rounded-full bg-pacific-cyan/10 blur-[120px] pointer-events-none -z-10"
        />

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium glass-pill text-muted mb-8 border border-white/10 shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{homeContent.heroStatus}</span>
          <span className="text-white/20">•</span>
          <span className="text-pacific-cyan font-semibold">{homeContent.heroBadge}</span>
        </div>

        {/* Medium-sized Integrated Portrait */}
        <div data-particle-protected className="relative mb-8 group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pacific-cyan/40 via-apricot-cream/30 to-pacific-cyan/40 blur-md opacity-60 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-pacific-cyan/50 p-1 bg-surface/80 shadow-2xl">
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
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground font-space leading-[1.08]">
            {homeContent.heroTitlePrefix}{" "}
            <span className="text-pacific-cyan" id="hero-name">
              {homeContent.heroName}
            </span>
          </h1>
          <HeroRoleTyping />
        </div>

        {/* Bio statement */}
        <p data-particle-protected className="mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed font-sans">
          {homeContent.heroBio}
        </p>

        {/* Primary CTAs */}
        <div data-particle-protected className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 w-full max-w-xs sm:max-w-none mx-auto">
          <Link
            href="/projects"
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all duration-200 shadow-[0_0_25px_rgba(24,155,173,0.35)] hover:shadow-[0_0_35px_rgba(24,155,173,0.5)] transform hover:-translate-y-0.5 text-center"
          >
            <span>{homeContent.heroPrimaryCtaText}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-foreground font-medium text-sm hover:border-pacific-cyan/40 transition-all duration-200 text-center"
          >
            <span>{homeContent.heroSecondaryCtaText}</span>
            <Send className="w-4 h-4 text-pacific-cyan shrink-0" />
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

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: FEATURED PROJECTS (Case Studies)                  */}
      {/* ------------------------------------------------------------- */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2 text-pacific-cyan font-mono text-xs uppercase tracking-wider mb-2">
              <Code2 className="w-4 h-4" />
              <span>{homeContent.featuredDescription}</span>
            </div>
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

        {/* Project Case Studies Cards */}
        <div className="flex flex-col gap-12">
          {featuredProjects.map((project) => (
            <article
              key={project._id || project.slug}
              data-particle-protected
              className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.08] hover:border-pacific-cyan/30 flex flex-col gap-6"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/20">
                    {project.category}
                  </span>
                  <span className="text-xs font-mono text-muted/60">{project.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                      aria-label="View Source Code"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pacific-cyan/10 text-pacific-cyan hover:bg-pacific-cyan/20 transition-colors"
                    >
                      <span>Live Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & description */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground font-space">
                  {project.title}
                </h3>
                {project.tagline && (
                  <p className="text-base text-apricot-cream/90 font-medium mt-1">
                    {project.tagline}
                  </p>
                )}
                <p className="text-sm sm:text-base text-muted leading-relaxed mt-3 max-w-3xl">
                  {project.description}
                </p>
              </div>

              {/* Preview Image if uploaded */}
              {project.previewImage && project.previewImage !== "/images/profile.png" && (
                <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-72 rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60">
                  <Image
                    src={project.previewImage}
                    alt={project.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 hover:scale-[1.01]"
                    sizes="(max-width: 768px) 100vw, 1100px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.7)] via-transparent to-transparent pointer-events-none" />
                </div>
              )}


              {/* Problem vs Solution breakdown */}
              {(project.problem || project.solution) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {project.problem && (
                    <div className="p-4 rounded-xl bg-ink-black/40 border border-white/5">
                      <span className="text-xs font-mono uppercase text-red-400/90 tracking-wider">The Challenge</span>
                      <p className="text-xs sm:text-sm text-muted/90 mt-1.5 leading-relaxed">{project.problem}</p>
                    </div>
                  )}
                  {project.solution && (
                    <div className="p-4 rounded-xl bg-ink-black/40 border border-white/5">
                      <span className="text-xs font-mono uppercase text-emerald-400/90 tracking-wider">The Architecture</span>
                      <p className="text-xs sm:text-sm text-muted/90 mt-1.5 leading-relaxed">{project.solution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Outcome & Engineering Focus Row */}
              <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md text-xs font-mono text-muted/80 bg-white/[0.04] border border-white/[0.06]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {project.engineeringFocus && project.engineeringFocus.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-muted/50 tracking-wider">
                      Engineering Focus:
                    </span>
                    {project.engineeringFocus.map((focus) => (
                      <span
                        key={focus}
                        className="px-2.5 py-0.5 rounded-full text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
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

        {/* 4 Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* 4 Value Proposition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

        {/* Journey Timeline */}
        <div data-particle-protected className="glass-panel rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.06]">
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
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: CALL TO ACTION (CTA)                              */}
      {/* ------------------------------------------------------------- */}
      <BorderGlow borderRadius={24} className="w-full">
        <section
          data-particle-protected
          className="relative rounded-3xl glass-panel p-8 sm:p-12 md:p-16 border border-white/[0.08] overflow-hidden text-center flex flex-col items-center"
        >
          {/* Subtle radial accent */}
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-pacific-cyan/15 blur-[100px] pointer-events-none"
          />

          <span className="text-xs font-mono font-medium text-pacific-cyan uppercase tracking-wider mb-3">
            Let&apos;s Build Together
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-space max-w-2xl leading-tight">
            Ready to build your next <span className="text-apricot-cream">project</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl mt-4 leading-relaxed">
            Whether you need a full-stack web application, a responsive interface, or a modern frontend, I&apos;m ready to collaborate.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all duration-200 shadow-[0_0_30px_rgba(24,155,173,0.35)] transform hover:-translate-y-0.5"
            >
              <span>Start a Conversation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-foreground font-medium text-sm hover:border-pacific-cyan/40 transition-colors"
            >
              <span>{contactEmail}</span>
            </a>
          </div>
        </section>
      </BorderGlow>
    </div>
  );
}

"use client";

import "@/components/orbit/orbit.css";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import OrbitEmblem from "@/components/orbit/OrbitEmblem";
import { useLocalGreeting } from "@/components/orbit/greetingClock";
import { useWelcomeMessage } from "@/components/orbit/welcomeMessage";
import type { GreetingCopy } from "@/lib/orbit-greeting";
import MaskText from "@/components/system/MaskText";

interface OrbitInviteProps {
  title?: string;
  greeting?: string;
  disclaimer?: string;
  /** Orbit's CMS greetings by local time (ai.greetingMorning …) */
  greetings?: GreetingCopy;
  /** Orbit's welcome messages (ai.welcomeMessages); one is drawn per visit */
  welcomeMessages?: string[];
}

/**
 * Homepage introduction to Rawin Orbit — deliberately quieter than the hero.
 * Its third column carries the same kind of line Orbit opens with on its own page: the CMS
 * greeting for the visitor's local time and a welcome message drawn for this visit, linking
 * straight into Orbit. Until the visitor's clock is known
 * (server render, hydration) the line keeps its space, so nothing shifts when it appears.
 */
export default function OrbitInvite({ title = "Rawin Orbit", greeting, disclaimer, greetings, welcomeMessages }: OrbitInviteProps) {
  const timeGreeting = useLocalGreeting(greetings);
  const welcome = useWelcomeMessage(welcomeMessages);
  const local = timeGreeting && welcome ? `${timeGreeting} ${welcome}` : "";
  const words = title.trim().split(/\s+/);

  return (
    <section aria-label={title} className="relative border-y border-line py-12 sm:py-16 lg:py-20">
      <div className="grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-7 md:gap-y-10 items-center">
        {/* Orb — on phones it shares a row with the section label so the width is used */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex items-center md:justify-center gap-6 sm:gap-8">
          <OrbitEmblem
            mood="idle"
            className="w-[96px] min-[380px]:w-[108px] sm:w-[150px] md:w-[180px] lg:w-[220px] ml-[14px] md:ml-0"
          />
          <div className="md:hidden flex-1 min-w-0">
            <p className="label-mono text-fg-muted">
              <span className="text-accent mr-2.5">05</span>
              Contextual assistant
            </p>
            <span aria-hidden="true" className="mt-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-line-strong" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            </span>
          </div>
        </div>

        {/* Copy */}
        <div className="col-span-12 md:col-span-8 lg:col-span-4">
          <p className="hidden md:block label-mono text-fg-muted mb-5">
            <span className="text-accent mr-3">05</span>
            Contextual assistant
          </p>
          {/* One line on phones (scaled to fit), two stacked lines from md up */}
          <MaskText
            as="h2"
            className="orbit-invite-title display-md text-fg"
            lines={
              words.length > 1
                ? [
                    <span key="l0" className="whitespace-nowrap md:whitespace-normal">
                      {words.slice(0, -1).join(" ")}
                      <span className="md:hidden">&nbsp;</span>
                      <br className="hidden md:block" />
                      <em className="italic text-accent">{words[words.length - 1]}</em>
                    </span>,
                  ]
                : [<span key="l1">{title}</span>]
            }
          />
          <p className="mt-5 text-[15px] sm:text-base text-fg-muted leading-relaxed max-w-[42ch]">
            {greeting ||
              "An assistant built into RAWIN that answers questions about the work, the stack and the process behind it."}
          </p>
          <p className="mt-3 text-[12px] text-fg-subtle">{disclaimer || "Orbit is an AI assistant. It can make mistakes."}</p>
          <Link href="/ai" className="mt-7 btn btn-primary pr-2 gap-4 group">
            <span>Open Orbit</span>
            <span className="w-8 h-8 rounded-full bg-inverse-fg/12 flex items-center justify-center transition-transform duration-500 group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Orbit's own opening line, for this visitor's time of day */}
        <div className="col-span-12 md:col-start-5 md:col-span-8 lg:col-start-auto lg:col-span-5">
          <Link
            href="/ai"
            aria-label={local ? `${local} Open ${title}` : `Open ${title}`}
            className={`group flex items-start gap-4 border-t border-line pt-6 lg:pt-8 min-h-[7.5rem] transition-opacity duration-700 ${local ? "opacity-100" : "opacity-0"}`}
          >
            <span aria-hidden="true" className="mt-[0.75em] h-px w-8 shrink-0 bg-accent/70 transition-[width] duration-500 group-hover:w-12" />
            <span className="flex-1 font-display text-[1.6rem] sm:text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.12] tracking-[-0.015em] text-fg" style={{ textWrap: "balance" }}>
              {local || "\u00a0"}
            </span>
            <ArrowUpRight className="mt-2 w-5 h-5 shrink-0 text-fg-subtle transition-[transform,color] duration-500 group-hover:rotate-45 group-hover:text-accent" />
          </Link>
        </div>
      </div>
    </section>
  );
}

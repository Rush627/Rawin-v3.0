"use client";

import { useEffect, useState } from "react";
import { AWAKENING_DONE_KEY, recordDoneEvent } from "@/lib/startup/launch";
import { STARTUP_REVEAL_EVENT } from "@/lib/startup/boot-script";
import FutureSystem from "./FutureSystem";
import type { StartupEnd, StartupLayout } from "./clock";
import "./startup.css";

interface Live {
  choice: "supernova" | "awakening";
  layout: StartupLayout;
  reduced: boolean;
  eventId: string | null;
}

/**
 * The startup coordinator's in-page half, in the root layout so it covers the first paint and
 * outlives route changes (client navigation never replays a startup: only the pre-paint boot
 * script decides, once per page load). It plays what the boot script chose (html[data-startup])
 * and writes completion records only here, only after the animation ends:
 *   - Supernova finished: the event id is stored for this browser (localStorage); a skip, a
 *     crash or a reload mid-way stores nothing, so the launch shows again next time;
 *   - any Supernova end, or Signal Awakening finished or skipped: Signal Awakening is marked
 *     done for this session, so the two never play back to back.
 * The server markup is a plain cover (the Future System ground) shown by CSS only when the boot script set html[data-startup]; a CSS fail-safe
 * and the boot script's own timer remove it even if this component never runs.
 */
export default function StartupStage({ title, subtitle, durationS, logo }: { title: string; subtitle: string; durationS: number; logo?: { url: string; alt?: string } | null }) {
  const [live, setLive] = useState<Live | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    const choice = d.getAttribute("data-startup");
    if ((choice !== "supernova" && choice !== "awakening") || d.getAttribute("data-startup-phase") === "done") {
      requestAnimationFrame(() => setGone(true));
      return;
    }
    requestAnimationFrame(() =>
      setLive({
        choice,
        layout: d.getAttribute("data-startup-layout") === "mobile" ? "mobile" : "desktop",
        reduced: d.getAttribute("data-startup-reduced") === "true",
        eventId: d.getAttribute("data-startup-event"),
      }),
    );
    // the boot script's fail-safe ended the phase (e.g. this tab was frozen): stand down
    const mo = new MutationObserver(() => {
      if (d.getAttribute("data-startup-phase") === "done") setGone(true);
    });
    mo.observe(d, { attributes: true, attributeFilter: ["data-startup-phase"] });
    return () => mo.disconnect();
  }, []);

  if (gone) return null;

  const reveal = () => {
    const d = document.documentElement;
    if (d.getAttribute("data-startup-phase") === "play") {
      d.setAttribute("data-startup-phase", "reveal");
      window.dispatchEvent(new Event(STARTUP_REVEAL_EVENT));
    }
  };
  const done = (how: StartupEnd) => {
    if (!live) return;
    try {
      if (live.choice === "supernova" && how === "finish" && live.eventId) recordDoneEvent(window.localStorage, live.eventId);
    } catch {
      // storage blocked: the launch may show again, never wrongly hidden
    }
    try {
      window.sessionStorage.setItem(AWAKENING_DONE_KEY, "1");
    } catch {
      // storage blocked: at worst Signal Awakening shows again on a later full load
    }
    reveal();
    document.documentElement.setAttribute("data-startup-phase", "done");
    setGone(true);
  };

  return (
    <div className="rawin-startup" data-live={live ? "true" : undefined}>
      <div className="rs-cover" aria-hidden="true" />
      {live ? (
        <FutureSystem
          mode={live.choice === "supernova" ? "launch" : "awakening"}
          layout={live.layout}
          reduced={live.reduced}
          durationS={durationS}
          title={title}
          subtitle={subtitle}
          logo={logo}
          onReveal={reveal}
          onDone={done}
        />
      ) : null}
    </div>
  );
}

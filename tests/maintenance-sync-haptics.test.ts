// Run with: npm test
// Verification of maintenance-mode reliability, live CMS synchronization,
// touch interactions, analytics country-to-map focus, studio login copy,
// and the capability-aware haptic feedback layer.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/resolve-ts.mjs", import.meta.url);

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("haptics: safe execution in non-browser environment (Node.js)", async () => {
  const { triggerHaptic, haptic } = await import("../src/lib/haptics.ts");
  assert.equal(typeof triggerHaptic, "function");
  assert.equal(triggerHaptic("selection"), false, "non-browser returns false safely");
  assert.equal(haptic.selection(), false);
  assert.equal(haptic.impact(), false);
  assert.equal(haptic.success(), false);
});

test("haptics: Web Vibration API detection and execution", async () => {
  const { triggerHaptic, haptic } = await import("../src/lib/haptics.ts");
  let vibratePattern: number | number[] | null = null;

  const origVibrate = Object.getOwnPropertyDescriptor(navigator, "vibrate");
  const origWindow = globalThis.window;

  try {
    Object.defineProperty(navigator, "vibrate", {
      value: (pattern: number | number[]) => {
        vibratePattern = pattern;
        return true;
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
      writable: true,
    });

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(triggerHaptic("selection"), true, "vibration triggers on selection");
    assert.equal(vibratePattern, 8, "selection uses subtle 8ms pattern");

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(haptic.impact(), true, "impact triggers");
    assert.equal(vibratePattern, 14, "impact uses 14ms pattern");

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(haptic.success(), true, "success triggers");
    assert.deepEqual(vibratePattern, [10, 30, 15], "success uses subtle double pulse");
  } finally {
    if (origVibrate) Object.defineProperty(navigator, "vibrate", origVibrate);
    else delete (navigator as Record<string, unknown>).vibrate;
    if (origWindow !== undefined) {
      Object.defineProperty(globalThis, "window", { value: origWindow, configurable: true, writable: true });
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
  }
});

test("haptics: WebKit native bridge integration (iOS native app wrapper)", async () => {
  const { triggerHaptic } = await import("../src/lib/haptics.ts");
  let postedMessage: unknown = null;

  const origWindow = globalThis.window;
  try {
    const mockWindow = {
      webkit: {
        messageHandlers: {
          haptic: {
            postMessage: (msg: unknown) => {
              postedMessage = msg;
            },
          },
        },
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      configurable: true,
      writable: true,
    });

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(triggerHaptic("selection"), true);
    assert.deepEqual(postedMessage, { type: "selection" });

    postedMessage = null;
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(triggerHaptic("impact"), true);
    assert.deepEqual(postedMessage, { type: "impact" });
  } finally {
    if (origWindow !== undefined) {
      Object.defineProperty(globalThis, "window", { value: origWindow, configurable: true, writable: true });
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
  }
});

test("haptics: iPhone Safari without native bridge fails silently and safely", async () => {
  const { triggerHaptic } = await import("../src/lib/haptics.ts");

  const origWindow = globalThis.window;
  try {
    // Safari does not have navigator.vibrate, nor webkit.messageHandlers.haptic
    const mockWindow = {
      navigator: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      configurable: true,
      writable: true,
    });

    await new Promise((r) => setTimeout(r, 70));
    assert.equal(triggerHaptic("selection"), false, "returns false without error on iOS Safari");
    await new Promise((r) => setTimeout(r, 70));
    assert.equal(triggerHaptic("impact"), false, "returns false without error on iOS Safari");
  } finally {
    if (origWindow !== undefined) {
      Object.defineProperty(globalThis, "window", { value: origWindow, configurable: true, writable: true });
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
  }
});

test("maintenance gate: public APIs return 503 during maintenance mode unless admin", () => {
  const summaryRoute = src("src/app/api/analytics/summary/route.ts");
  assert.match(summaryRoute, /maintenanceActiveNow\(content\.maintenance\)/, "summary route checks maintenance");
  assert.match(summaryRoute, /getAdminSession\(\)/, "summary route checks admin session");
  assert.match(summaryRoute, /status:\s*503/, "summary route returns 503");

  const chatRoute = src("src/app/api/ai/chat/route.ts");
  assert.match(chatRoute, /maintenanceActiveNow\(siteContent\.maintenance\)/, "chat route checks maintenance");
  assert.match(chatRoute, /getAdminSession\(\)/, "chat route checks admin session");
  assert.match(chatRoute, /status:\s*503/, "chat route returns 503");
});

test("maintenance reliability: site content fallbacks prevent uncaught 500s", () => {
  const siteContent = src("src/lib/site-content.ts");
  assert.match(siteContent, /return DEFAULT_SITE_CONTENT/, "returns in-memory fallback on db error");

  const projects = src("src/lib/projects.ts");
  assert.match(projects, /return \[\]/, "projects returns empty array fallback on failure");

  const blog = src("src/lib/blog.ts");
  assert.match(blog, /return \[\]/, "blog returns empty array fallback on failure");
});

test("CMS synchronization: revision endpoint and availability route serve fresh revision with no-store", () => {
  const availRoute = src("src/app/api/availability/route.ts");
  assert.match(availRoute, /Cache-Control['":\s]+no-store/, "availability route disables caching");
  assert.match(availRoute, /revision/, "availability route exposes revision");

  const revRoute = src("src/app/api/content/revision/route.ts");
  assert.match(revRoute, /Cache-Control['":\s]+no-store/, "content revision route disables caching");
  assert.match(revRoute, /revision/, "content revision route exposes revision");
});

test("CMS synchronization: client watcher handles revision without full-page reloads", () => {
  const watcher = src("src/components/AvailabilityWatcher.tsx");
  assert.match(watcher, /router\.refresh\(\)/, "uses router.refresh() to update server components");
  assert.ok(!watcher.includes("window.location.reload()"), "does not perform indiscriminate full-page reload");
  assert.match(watcher, /visibilitychange/, "listens to visibility changes");
  assert.match(watcher, /document\.visibilityState === "visible"/, "only polls when tab is visible");
});

test("touch interactions: hover effects wrapped in media query to prevent sticky states on mobile", () => {
  const globals = src("src/app/globals.css");
  assert.match(globals, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/, "globals.css guards hover styles");

  const analyticsCss = src("src/components/analytics/analytics.css");
  assert.match(analyticsCss, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/, "analytics.css guards country row hover");
  assert.match(analyticsCss, /\.an-rank\[aria-selected="true"\]/, "has persistent selected state style");
  assert.match(analyticsCss, /\.an-rank:active/, "has transient active press style");
});

test("analytics map focus: country selection centers map and brings into view on mobile", () => {
  const view = src("src/components/analytics/AnalyticsView.tsx");
  assert.match(view, /focusCountryOnMap/, "implements focusCountryOnMap function");
  assert.match(view, /decodeGrid\(\)/, "decodes grid coordinates");
  assert.match(view, /scrollContainer\.scrollTo/, "scrolls map horizontally to target coordinate");
  assert.match(view, /aria-selected=\{picked === c\.code \? "true" : "false"\}/, "country row receives aria-selected");
  assert.match(view, /haptic\.selection\(\)/, "country row selection triggers haptic feedback");
});

test("studio login copy: polished, developer terminology, no em dashes, no legacy names", () => {
  const login = src("src/app/saint-denis/login/page.tsx");
  assert.ok(!login.includes("—"), "no em dash in studio login page");
  assert.ok(!/Aura|Cognitive Assistant|RAWIN AI Assistant/.test(login), "no prohibited legacy product names");
  assert.ok(!/Engineer|Engineering/.test(login), "uses Developer rather than Engineer");
  assert.match(login, /Studio/, "retains Studio identity");
  assert.match(login, /Developer/, "mentions Developer");
});

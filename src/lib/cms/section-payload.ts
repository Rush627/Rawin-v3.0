/* eslint-disable @typescript-eslint/no-explicit-any -- validates untyped JSON submitted by the editors */
/**
 * Validation for admin content saves: turns a submitted section (one string per allowed key,
 * structured values as JSON) into the payload written to site_content.main.<section>.
 *
 * Pure — no database, session or Next imports — so the exact contract between the admin
 * editors and the server is unit-tested (tests/cms-payload.test.ts). The server action
 * (app/saint-denis/content/actions.ts) adds the session check, the write and cache invalidation.
 *
 * Only keys listed for a section are read, and keys missing from the submission are left
 * untouched in the database (updates are dot-notated $set per key), so saving one editor can
 * never clear fields owned by another.
 */
import { parseWelcomeMessagesInput } from "../orbit-welcome";
import { evolutionFallback } from "../brand-assets";
import { CONTENT_ICON_IDS } from "./icons";
import {
  splitLedgerDescription,
  parseAvailabilityField,
  parseSeoField,
  parseCapabilitiesField,
  parseValuesField,
  parseJourneyField,
} from "./fields";

export type EditableSection =
  | "global"
  | "home"
  | "about"
  | "contact"
  | "resume"
  | "uses"
  | "ai"
  | "taxonomy"
  | "availability"
  | "seo";

export type PayloadResult =
  | { ok: true; payload: Record<string, any> }
  | { ok: false; error: string; field: string };

export const SECTION_ALLOWED_KEYS: Record<EditableSection, string[]> = {
  // Contact email/location live in `contact`; availability lives in `availability`. The legacy
  // global copies stay stored (read as fallbacks) but are no longer writable from the admin.
  global: [
    "brandName",
    "siteTitle",
    "shortBio",
    "footerCopyright",
    "footerBulletNotification",
    "footerClosingLabel",
    "closingInvite",
    "closingPrompt",
    "closingCta",
    "headerBrand",
    "themeDefaultDesktop",
    "themeDefaultMobile",
  ],
  home: [
    "heroTitlePrefix",
    "heroName",
    "heroBio",
    "heroPrimaryCtaText",
    "heroSecondaryCtaText",
    "featuredHeading",
    "featuredDescription",
    "heroTypingPhrases",
    "capabilities",
    "values",
    "showCapabilities",
    "showValues",
    "showJourney",
    "showHeroFocus",
    "showHeroAvailability",
    "showHeroWork",
  ],
  about: [
    "eyebrow",
    "title",
    "subtitle",
    "narrativeEyebrow",
    "leadText",
    "narrativeText",
    "progressionItem1",
    "progressionItem2",
    "progressionItem3",
    "metadataItem1",
    "metadataItem2",
    "metadataItem3",
    "metadataItem4",
    "evolutionEyebrow",
    "evolutionHeading",
    "evolutionDescription",
    "evolution",
    "milestoneLabels",
    "principlesEyebrow",
    "principlesHeading",
    "principlesDescription",
    "principles",
    "journeyEyebrow",
    "journeyHeading",
    "journeyDescription",
    "journey",
    "focusEyebrow",
    "focusHeading",
    "focusDescription",
    "focusAreas",
    "ctaEyebrow",
    "ctaHeading",
    "ctaDescription",
    "ctaResumeText",
    "ctaContactText",
  ],
  contact: [
    "eyebrow",
    "title",
    "description",
    "email",
    "phone",
    "showPhoneNumber",
    "location",
    "socials",
    "form",
    "successTitle",
    "successMessage",
    "responseTime",
  ],
  // The resume shows the canonical contact identity and availability; only its website is its own.
  resume: [
    "eyebrow",
    "title",
    "subtitle",
    "summary",
    "ctaText",
    "pdfLabel",
    "profileLabel",
    "skillsLabel",
    "experienceLabel",
    "educationLabel",
    "ctaEyebrow",
    "indexLabel",
    "statusLabel",
    "roleLabel",
    "locationLabel",
    "sinceLabel",
    "website",
    "skills",
    "experience",
    "education",
    "cta",
  ],
  uses: [
    "eyebrow",
    "title",
    "description",
    "ledgerLabel",
    "updatedYear",
    "updateLabel",
    "dailyStack",
    "developmentStack",
    "howIBuild",
    "currentlyExploring",
    "mySetup",
  ],
  ai: [
    "title",
    "greetingMessage",
    "mobileComposerPlaceholder",
    "desktopComposerPlaceholder",
    "greetingMorning",
    "greetingAfternoon",
    "greetingEvening",
    "greetingLateNight",
    "welcomeMessages",
    "disclaimer",
    "voiceInput",
    "voicePlayback",
    "fileAttachments",
    "serverTranscription",
  ],
  taxonomy: ["projectCategories", "blogCategories"],
  availability: ["state", "label", "note"],
  seo: ["home", "about", "projects", "blog", "uses", "resume", "contact", "ai"],
};

/** Resume interface labels: short by design (they sit in mono caps and on buttons). */
const RESUME_LABEL_KEYS = new Set([
  "pdfLabel",
  "profileLabel",
  "skillsLabel",
  "experienceLabel",
  "educationLabel",
  "ctaEyebrow",
  "indexLabel",
  "statusLabel",
  "roleLabel",
  "locationLabel",
  "sinceLabel",
]);

const LONG_FIELDS = new Set([
  "shortBio",
  "heroBio",
  "leadText",
  "narrativeText",
  "description",
  "evolutionDescription",
  "focusDescription",
  "ctaDescription",
  "summary",
  "successMessage",
  "greetingMessage",
  "developmentStack",
  "dailyStack",
  "howIBuild",
  "currentlyExploring",
  "mySetup",
  "contact",
  "socials",
  "form",
  "status",
  "skills",
  "experience",
  "education",
  "cta",
  "evolution",
  "principles",
  "focusAreas",
  "heroTypingPhrases",
]);

const ALLOWED_ICON_IDS = new Set<string>(["", ...CONTENT_ICON_IDS]);


export function buildSectionPayload(section: EditableSection, get: (key: string) => unknown): PayloadResult {
  const allowedKeys = SECTION_ALLOWED_KEYS[section];
  if (!allowedKeys) return { ok: false, error: `Invalid content section: "${section}".`, field: "" };
  const payload: Record<string, any> = {};
  const fail = (field: string, error: string): PayloadResult => ({ ok: false, error, field });

  for (const key of allowedKeys) {
    const rawVal = get(key);
    if (typeof rawVal === "string") {
      const trimmed = rawVal.trim();

      // Disallow em dashes
      if (/[\u2014\u2013]/.test(trimmed)) {
        return fail(key, `Field "${key}" contains an em dash. Please use hyphens or middle dots (·) instead.`);
      }

      // ---- fields added by the admin overhaul (validators in lib/cms/fields)
      if (section === "availability") {
        const r = parseAvailabilityField(key as "state" | "label" | "note", trimmed);
        if (!r.ok) return fail(key, r.error);
        payload[key] = r.value;
        continue;
      }
      if (section === "seo") {
        const r = parseSeoField(trimmed);
        if (!r.ok) return fail(key, r.error);
        payload[key] = r.value;
        continue;
      }
      if (section === "home" && key === "capabilities") {
        const r = parseCapabilitiesField(trimmed);
        if (!r.ok) return fail(key, r.error);
        payload[key] = r.value;
        continue;
      }
      if (section === "home" && key === "values") {
        const r = parseValuesField(trimmed);
        if (!r.ok) return fail(key, r.error);
        payload[key] = r.value;
        continue;
      }
      if (section === "about" && key === "journey") {
        const r = parseJourneyField(trimmed);
        if (!r.ok) return fail(key, r.error);
        payload[key] = r.value;
        continue;
      }
      if (section === "global" && (key === "closingInvite" || key === "closingPrompt" || key === "closingCta")) {
        const max = key === "closingInvite" ? 120 : 40;
        if (trimmed.length > max) return fail(key, `Keep this under ${max} characters.`);
        payload[key] = trimmed;
        continue;
      }
      if (section === "resume" && key === "website") {
        // stored inside resume.contact; written as a dotted path so the legacy email/location
        // fallbacks beside it are left untouched
        if (trimmed) {
          try {
            const u = new URL(trimmed);
            if (u.protocol !== "http:" && u.protocol !== "https:") return fail(key, "Website must begin with http:// or https://");
          } catch {
            return fail(key, "Please provide a valid website URL.");
          }
          if (trimmed.length > 200) return fail(key, "Website URL exceeds 200 characters.");
        }
        payload["contact.website"] = trimmed;
        continue;
      }

      if (key === "updatedYear") {
        if (!/^\d{4}$/.test(trimmed)) {
          return fail(key, "Updated year must be a valid 4-digit year (e.g. 2026).");
        }
        payload[key] = trimmed;
        continue;
      }

      if (section === "uses" && key === "ledgerLabel") {
        if (trimmed.length > 40) {
          return fail(key, "Ledger label cannot exceed 40 characters.");
        }
        payload[key] = trimmed;
        continue;
      }

      if (section === "uses" && key === "updateLabel") {
        // The year has its own field; a year typed at the end of the description is dropped
        // so the two can never disagree on the page.
        const { description } = splitLedgerDescription(trimmed);
        if (description.length > 80) {
          return fail(key, "Ledger description cannot exceed 80 characters.");
        }
        payload[key] = description;
        continue;
      }

      if (key === "footerClosingLabel") {
        if (trimmed.length > 40) {
          return fail(key, "Closing label cannot exceed 40 characters.");
        }
        payload[key] = trimmed;
        continue;
      }

      if (key === "footerBulletNotification") {
        if (trimmed.length > 300) {
          return fail(key, "Footer bullet notification cannot exceed 300 characters.");
        }
        payload[key] = trimmed;
        continue;
      }

      if (section === "ai" && key === "welcomeMessages") {
        const result = parseWelcomeMessagesInput(trimmed);
        if (!result.ok) return fail(key, result.error);
        payload[key] = result.messages;
        continue;
      }

      if (key === "dailyStack") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Daily stack must be an array.");
          }
          if (parsed.length > 50) {
            return fail(key, "Daily stack cannot exceed 50 items.");
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const name = String(item.name || "").trim();
            const description = String(item.description || "").trim();
            const category = String(item.category || "").trim();
            const icon = String(item.icon || "code").trim().toLowerCase();
            const id = String(item.id || `daily-${i + 1}`).trim().slice(0, 50);
            const order = typeof item.order === "number" ? item.order : i + 1;
            const enabled = item.enabled !== false;
            if (!name) return fail(key, `Daily stack item #${i + 1} must have a name.`);
            if (name.length > 80) return fail(key, `Item "${name.slice(0, 20)}..." name exceeds 80 characters.`);
            if (description.length > 400) return fail(key, `Item "${name}" description exceeds 400 characters.`);
            if (category.length > 60) return fail(key, `Item "${name}" category exceeds 60 characters.`);
            cleanedItems.push({ id, name, description, category, icon, order, enabled });
          }
          payload[key] = cleanedItems;
        } catch {
          return fail(key, "Invalid JSON for daily stack.");
        }
        continue;
      }

      if (key === "developmentStack") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Development stack must be an array.");
          }
          if (parsed.length > 30) {
            return fail(key, "Development stack cannot exceed 30 items.");
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const name = String(item.name || "").trim();
            const description = String(item.description || "").trim();
            const category = String(item.category || "").trim();
            const icon = String(item.icon || "").trim().toLowerCase();
            if (icon && !ALLOWED_ICON_IDS.has(icon)) {
              return fail(key, `Invalid icon "${icon}" for item "${name}".`);
            }
            const group = String(item.group || "Core Architecture").trim().slice(0, 60);
            const displayOrder = typeof item.displayOrder === "number" ? item.displayOrder : i + 1;
            const enabled = item.enabled !== false;
            const id = String(item.id || `dev-${i + 1}`).trim().slice(0, 50);
            if (!name) return fail(key, "Each development stack item must have a name.");
            if (name.length > 60) return fail(key, `Item "${name.slice(0, 20)}..." name exceeds 60 characters.`);
            if (description.length > 300) return fail(key, `Item "${name}" description exceeds 300 characters.`);
            if (category.length > 50) return fail(key, `Item "${name}" category exceeds 50 characters.`);
            cleanedItems.push({ id, name, description, category, icon, group, displayOrder, enabled });
          }
          payload[key] = cleanedItems;
        } catch {
          return fail(key, "Invalid JSON for development stack.");
        }
        continue;
      }

      if (key === "howIBuild") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "How I Build must be an array.");
          }
          if (parsed.length > 20) {
            return fail(key, "How I Build cannot exceed 20 steps.");
          }
          const cleanedSteps = [];
          for (let i = 0; i < parsed.length; i++) {
            const step = parsed[i];
            if (!step || typeof step !== "object") continue;
            const stepNum = String(step.step || step.number || `0${i + 1}`).trim().slice(0, 10);
            const title = String(step.title || "").trim().slice(0, 80);
            const description = String(step.description || "").trim().slice(0, 400);
            const order = typeof step.order === "number" ? step.order : i + 1;
            const enabled = step.enabled !== false;
            const id = String(step.id || `build-${i + 1}`).trim().slice(0, 50);
            if (!title) return fail(key, `Build step #${i + 1} must have a title.`);
            cleanedSteps.push({ id, step: stepNum, title, description, order, enabled });
          }
          payload[key] = cleanedSteps;
        } catch {
          return fail(key, "Invalid JSON for How I Build.");
        }
        continue;
      }

      if (key === "currentlyExploring") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Currently exploring must be an array.");
          }
          if (parsed.length > 30) {
            return fail(key, "Currently exploring cannot exceed 30 items.");
          }
          const cleanedItems = [];
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const name = String(item.name || "").trim();
            const description = String(item.description || "").trim();
            const category = String(item.category || "").trim();
            const icon = String(item.icon || "").trim().toLowerCase();
            if (icon && !ALLOWED_ICON_IDS.has(icon)) {
              return fail(key, `Invalid icon "${icon}" for item "${name}".`);
            }
            const displayOrder = typeof item.displayOrder === "number" ? item.displayOrder : 999;
            if (!name) return fail(key, "Each currently exploring item must have a name.");
            if (name.length > 60) return fail(key, `Item "${name.slice(0, 20)}..." name exceeds 60 characters.`);
            if (description.length > 300) return fail(key, `Item "${name}" description exceeds 300 characters.`);
            if (category.length > 50) return fail(key, `Item "${name}" category exceeds 50 characters.`);
            cleanedItems.push({ name, description, category, icon, displayOrder });
          }
          payload[key] = cleanedItems;
        } catch {
          return fail(key, "Invalid JSON for currently exploring.");
        }
        continue;
      }

      if (key === "mySetup") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "My Setup must be an object.");
          }
          payload[key] = {
            mainMachine: {
              label: String(parsed.mainMachine?.label || "Main machine").trim().slice(0, 60),
              value: String(parsed.mainMachine?.value || "Windows PC").trim().slice(0, 100),
              description: String(parsed.mainMachine?.description || "").trim().slice(0, 300),
            },
            fuel: {
              label: String(parsed.fuel?.label || "Fuel").trim().slice(0, 60),
              value: String(parsed.fuel?.value || "Passion to build something worth showing.").trim().slice(0, 150),
              description: String(parsed.fuel?.description || "").trim().slice(0, 300),
            },
            currentStatus: {
              label: String(parsed.currentStatus?.label || "Current status").trim().slice(0, 60),
              value: String(parsed.currentStatus?.value || "Probably coding.").trim().slice(0, 100),
              description: String(parsed.currentStatus?.description || "").trim().slice(0, 300),
            },
          };
        } catch {
          return fail(key, "Invalid JSON for My Setup.");
        }
        continue;
      }

      if (key === "contact") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "Contact must be an object.");
          }
          const email = String(parsed.email || "").trim();
          const website = String(parsed.website || "").trim();
          const location = String(parsed.location || "").trim();

          if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email) || email.length > 100) {
              return fail(key, "Please provide a valid email address.");
            }
          }
          if (website) {
            try {
              const u = new URL(website);
              if (u.protocol !== "http:" && u.protocol !== "https:") {
                return fail(key, "Website must begin with http:// or https://");
              }
            } catch {
              return fail(key, "Please provide a valid website URL.");
            }
            if (website.length > 200) {
              return fail(key, "Website URL exceeds 200 characters.");
            }
          }
          if (location.length > 100) {
            return fail(key, "Location exceeds 100 characters.");
          }

          payload[key] = {
            location: location.slice(0, 100),
            email: email.slice(0, 100),
            website: website.slice(0, 200),
          };
        } catch {
          return fail(key, "Invalid JSON for contact information.");
        }
        continue;
      }

      if (key === "socials") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "Social channels must be an object.");
          }
          const github = String(parsed.github || "").trim();
          const linkedin = String(parsed.linkedin || "").trim();
          const twitter = String(parsed.twitter || "").trim();
          const instagram = String(parsed.instagram || "").trim();

          const channels = [
            { name: "GitHub", url: github },
            { name: "LinkedIn", url: linkedin },
            { name: "X / Twitter", url: twitter },
            { name: "Instagram", url: instagram },
          ];

          for (const channel of channels) {
            if (channel.url) {
              if (channel.url.length > 250) {
                return fail(key, `${channel.name} URL cannot exceed 250 characters.`);
              }
              try {
                const u = new URL(channel.url);
                if (u.protocol !== "http:" && u.protocol !== "https:") {
                  return fail(key, `${channel.name} URL must begin with http:// or https://`);
                }
              } catch {
                return fail(key, `Please provide a valid URL for ${channel.name}.`);
              }
            }
          }

          payload[key] = {
            github: github.slice(0, 250),
            linkedin: linkedin.slice(0, 250),
            twitter: twitter.slice(0, 250),
            instagram: instagram.slice(0, 250),
          };
        } catch {
          return fail(key, "Invalid JSON for social channels.");
        }
        continue;
      }

      if (key === "form") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "Form placeholders must be an object.");
          }
          payload[key] = {
            namePlaceholder: String(parsed.namePlaceholder || "").trim().slice(0, 150),
            emailPlaceholder: String(parsed.emailPlaceholder || "").trim().slice(0, 150),
            phonePlaceholder: String(parsed.phonePlaceholder || "").trim().slice(0, 150),
            subjectPlaceholder: String(parsed.subjectPlaceholder || "").trim().slice(0, 150),
            messagePlaceholder: String(parsed.messagePlaceholder || "").trim().slice(0, 150),
          };
        } catch {
          return fail(key, "Invalid JSON for form placeholders.");
        }
        continue;
      }

      if (key === "email") {
        if (trimmed) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmed) || trimmed.length > 100) {
            return fail(key, "Please provide a valid email address.");
          }
        }
        payload[key] = trimmed.slice(0, 100);
        continue;
      }

      if (key === "phone") {
        if (trimmed.length > 40) {
          return fail(key, "Phone number cannot exceed 40 characters.");
        }
        payload[key] = trimmed.slice(0, 40);
        continue;
      }

      if (key === "headerBrand") {
        payload[key] = trimmed === "logo" ? "logo" : "wordmark";
        continue;
      }

      if (key === "themeDefaultDesktop" || key === "themeDefaultMobile") {
        if (trimmed !== "light" && trimmed !== "dark") {
          return fail(key, `${key === "themeDefaultDesktop" ? "Desktop" : "Smartphone"} default theme must be Light or Dark.`);
        }
        payload[key] = trimmed;
        continue;
      }

      if (
        key === "showCapabilities" ||
        key === "showValues" ||
        key === "showJourney" ||
        key === "showHeroFocus" ||
        key === "showHeroAvailability" ||
        key === "showHeroWork" ||
        key === "voiceInput" ||
        key === "voicePlayback" ||
        key === "fileAttachments" ||
        key === "serverTranscription"
      ) {
        payload[key] = trimmed === "true" || trimmed === "1" || trimmed === "on";
        continue;
      }

      if (key === "projectCategories" || key === "blogCategories") {
        let items: unknown[] = [];
        try {
          const parsed = JSON.parse(trimmed || "[]");
          items = Array.isArray(parsed) ? parsed : [];
        } catch {
          items = trimmed.split(/\r?\n/);
        }
        const seen = new Set<string>();
        const cleaned: string[] = [];
        for (const item of items) {
          const value = String(item ?? "").trim();
          if (!value) continue;
          if (value.length > 50) {
            return fail(key, `Category "${value.slice(0, 24)}..." exceeds 50 characters.`);
          }
          if (seen.has(value.toLowerCase())) continue;
          seen.add(value.toLowerCase());
          cleaned.push(value);
        }
        if (cleaned.length > 40) {
          return fail(key, "A category list cannot exceed 40 entries.");
        }
        if (cleaned.length === 0) {
          return fail(key, "Keep at least one category in each list.");
        }
        payload[key] = cleaned;
        continue;
      }

      if (key === "showPhoneNumber") {
        payload[key] = trimmed === "true" || trimmed === "1" || trimmed === "on";
        continue;
      }

      if (
        key === "heroStatusColor" ||
        key === "footerAvailabilityColor" ||
        key === "availabilityStatusColor"
      ) {
        const lower = trimmed.toLowerCase();
        if (lower !== "green" && lower !== "orange" && lower !== "red") {
          return fail(key, "Availability color must be green, orange, or red.");
        }
        payload[key] = lower;
        if (key === "footerAvailabilityColor") {
          payload["availabilityStatusColor"] = lower;
        }
        continue;
      }

      if (key === "footerAvailabilityBadge") {
        if (trimmed.length > 100) {
          return fail(key, "Footer availability badge cannot exceed 100 characters.");
        }
        payload[key] = trimmed;
        payload["availabilityBadge"] = trimmed;
        continue;
      }

      if (key === "location" && section === "contact") {
        if (trimmed.length > 120) {
          return fail(key, "Location cannot exceed 120 characters.");
        }
        payload[key] = trimmed.slice(0, 120);
        continue;
      }

      if (key === "status") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "Status must be an object.");
          }
          const text = String(parsed.text || "").trim().slice(0, 60);
          const rawIndicator = String(parsed.indicator || "").trim().toLowerCase();
          const allowedIndicators = ["green", "orange", "cyan", "gray"];
          const indicator = allowedIndicators.includes(rawIndicator) ? rawIndicator : "green";

          payload[key] = {
            text: text || "Available for hire",
            indicator,
          };
        } catch {
          return fail(key, "Invalid JSON for working status.");
        }
        continue;
      }

      if (key === "skills") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Skills must be an array of skill groups.");
          }
          if (parsed.length > 20) {
            return fail(key, "Skill groups cannot exceed 20 categories.");
          }
          const cleanedGroups = [];
          for (let i = 0; i < parsed.length; i++) {
            const group = parsed[i];
            if (!group || typeof group !== "object") continue;
            const title = String(group.title || "").trim();
            if (!title) {
              return fail(key, `Skill group #${i + 1} must have a title.`);
            }
            if (title.length > 60) {
              return fail(key, `Skill group "${title.slice(0, 20)}..." title exceeds 60 characters.`);
            }

            const rawSkills = Array.isArray(group.skills) ? group.skills : [];
            if (rawSkills.length > 30) {
              return fail(key, `Skill group "${title}" cannot exceed 30 skills.`);
            }
            const cleanedSkills = [];
            for (const s of rawSkills) {
              const skillName = String(s || "").trim();
              if (skillName) {
                if (skillName.length > 50) {
                  return fail(key, `Skill "${skillName.slice(0, 20)}..." exceeds 50 characters.`);
                }
                cleanedSkills.push(skillName);
              }
            }

            cleanedGroups.push({
              id: String(group.id || `group-${i + 1}`).trim().slice(0, 40),
              title,
              skills: cleanedSkills,
              displayOrder: typeof group.displayOrder === "number" ? group.displayOrder : i + 1,
            });
          }
          payload[key] = cleanedGroups;
        } catch {
          return fail(key, "Invalid JSON for skills.");
        }
        continue;
      }

      if (key === "experience") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Experience must be an array of timeline items.");
          }
          if (parsed.length > 20) {
            return fail(key, "Experience items cannot exceed 20 entries.");
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const role = String(item.role || "").trim();
            const organization = String(item.organization || "").trim();
            if (!role) {
              return fail(key, `Experience item #${i + 1} must have a role title.`);
            }
            if (!organization) {
              return fail(key, `Experience item #${i + 1} must have an organization name.`);
            }
            if (role.length > 80) return fail(key, `Role "${role.slice(0, 20)}..." exceeds 80 characters.`);
            if (organization.length > 80) return fail(key, `Organization "${organization.slice(0, 20)}..." exceeds 80 characters.`);

            const startDate = String(item.startDate || "").trim().slice(0, 20);
            const endDate = String(item.endDate || "").trim().slice(0, 20);
            const current = Boolean(item.current);
            const location = String(item.location || "").trim().slice(0, 60);

            const rawBullets = Array.isArray(item.bullets) ? item.bullets : [];
            if (rawBullets.length > 10) {
              return fail(key, `Experience "${role}" cannot exceed 10 bullet points.`);
            }
            const cleanedBullets = [];
            for (const b of rawBullets) {
              const bullet = String(b || "").trim();
              if (bullet) {
                if (bullet.length > 300) {
                  return fail(key, `Bullet in "${role}" exceeds 300 characters.`);
                }
                cleanedBullets.push(bullet);
              }
            }

            cleanedItems.push({
              id: String(item.id || `exp-${i + 1}`).trim().slice(0, 40),
              role,
              organization,
              startDate,
              endDate: current ? "" : endDate,
              current,
              location,
              bullets: cleanedBullets,
              displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : i + 1,
            });
          }
          payload[key] = cleanedItems;
        } catch {
          return fail(key, "Invalid JSON for experience.");
        }
        continue;
      }

      if (key === "education") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Education must be an array.");
          }
          if (parsed.length > 10) {
            return fail(key, "Education items cannot exceed 10 entries.");
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const degree = String(item.degree || "").trim();
            const institution = String(item.institution || "").trim();
            if (!degree) {
              return fail(key, `Education item #${i + 1} must have a degree/program.`);
            }
            if (!institution) {
              return fail(key, `Education item #${i + 1} must have an institution name.`);
            }
            if (degree.length > 100) return fail(key, `Degree "${degree.slice(0, 20)}..." exceeds 100 characters.`);
            if (institution.length > 100) return fail(key, `Institution "${institution.slice(0, 20)}..." exceeds 100 characters.`);

            const location = String(item.location || "").trim().slice(0, 60);
            const startDate = String(item.startDate || "").trim().slice(0, 20);
            const endDate = String(item.endDate || "").trim().slice(0, 20);
            const description = String(item.description || "").trim().slice(0, 300);

            cleanedItems.push({
              id: String(item.id || `edu-${i + 1}`).trim().slice(0, 40),
              degree,
              institution,
              location,
              startDate,
              endDate,
              description,
              displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : i + 1,
            });
          }
          payload[key] = cleanedItems;
        } catch {
          return fail(key, "Invalid JSON for education.");
        }
        continue;
      }

      if (key === "cta") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "CTA must be an object.");
          }
          payload[key] = {
            heading: String(parsed.heading || "").trim().slice(0, 100),
            description: String(parsed.description || "").trim().slice(0, 300),
            buttonText: String(parsed.buttonText || "").trim().slice(0, 40),
          };
        } catch {
          return fail(key, "Invalid JSON for CTA.");
        }
        continue;
      }

      if (key === "heroTypingPhrases") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Hero typing phrases must be an array.");
          }
          if (parsed.length > 25) {
            return fail(key, "Hero typing phrases cannot exceed 25 items.");
          }
          const cleanedPhrases: string[] = [];
          for (const item of parsed) {
            const phraseStr = String(item || "").trim();
            if (phraseStr) {
              if (/[\u2014\u2013]/.test(phraseStr)) {
                return fail(key, `Phrase "${phraseStr.slice(0, 20)}..." contains an em dash.`);
              }
              if (phraseStr.length > 100) {
                return fail(key, `Phrase "${phraseStr.slice(0, 20)}..." exceeds 100 characters.`);
              }
              cleanedPhrases.push(phraseStr);
            }
          }
          if (cleanedPhrases.length === 0) {
            return fail(key, "At least one valid Hero typing phrase is required.");
          }
          payload[key] = cleanedPhrases;
        } catch {
          return fail(key, "Invalid JSON for Hero typing phrases.");
        }
        continue;
      }

      if (key === "evolution") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Evolution milestones must be an array.");
          }
          if (parsed.length > 20) {
            return fail(key, "Evolution milestones cannot exceed 20 entries.");
          }
          const cleanedMilestones = [];
          for (let i = 0; i < parsed.length; i++) {
            const m = parsed[i];
            if (!m || typeof m !== "object") continue;
            const year = String(m.year || "").trim();
            const title = String(m.title || "").trim();
            if (!year) {
              return fail(key, `Milestone #${i + 1} must have a year.`);
            }
            if (!title) {
              return fail(key, `Milestone #${i + 1} must have a title.`);
            }
            const label = String(m.label || "").trim().slice(0, 60);
            const progression = String(m.progression || "").trim().slice(0, 100);
            const domain = String(m.domain || "").trim().slice(0, 100);
            const description = String(m.description || "").trim().slice(0, 1000);
            const preview = String(m.preview || evolutionFallback(year)).trim().slice(0, 300);
            const previewAlt = String(m.previewAlt || `${title} (${year}) preview`).trim().slice(0, 150);
            const ctaText = String(m.ctaText || "VIEW WEBSITE").trim().slice(0, 50);
            const isCurrent = Boolean(m.isCurrent || m.status === "current");
            const status = isCurrent ? ("current" as const) : ("archived" as const);
            const url = typeof m.url === "string" && m.url.trim() ? m.url.trim().slice(0, 300) : undefined;
            const displayOrder = typeof m.displayOrder === "number" ? m.displayOrder : i + 1;

            const rawTechs = Array.isArray(m.technologies)
              ? m.technologies
              : typeof m.technologies === "string"
              ? m.technologies.split(",").map((t: string) => t.trim())
              : [];
            const technologies = rawTechs
              .map((t: any) => String(t || "").trim().slice(0, 40))
              .filter(Boolean)
              .slice(0, 15);

            cleanedMilestones.push({
              id: String(m.id || `milestone-${i + 1}`).trim().slice(0, 40),
              year,
              label,
              progression,
              title,
              domain,
              description,
              technologies,
              url,
              status,
              isCurrent,
              preview,
              previewAlt,
              ctaText,
              displayOrder,
            });
          }
          payload[key] = cleanedMilestones;
        } catch {
          return fail(key, "Invalid JSON for evolution milestones.");
        }
        continue;
      }

      if (key === "milestoneLabels") {
        try {
          const parsed = typeof trimmed === "string" ? JSON.parse(trimmed || "{}") : trimmed;
          if (!parsed || typeof parsed !== "object") {
            return fail(key, "Milestone labels must be an object.");
          }
          const milestone01 = String(parsed.milestone01 ?? "2022 Milestone").trim().slice(0, 80);
          const milestone02 = String(parsed.milestone02 ?? "2023 Milestone").trim().slice(0, 80);
          const milestone03 = String(parsed.milestone03 ?? "2026 Milestone").trim().slice(0, 80);
          const currentEra = String(parsed.currentEra ?? "CURRENT ERA").trim().slice(0, 80);

          if (!milestone01) return fail(key, "Milestone 01 Label cannot be empty.");
          if (!milestone02) return fail(key, "Milestone 02 Label cannot be empty.");
          if (!milestone03) return fail(key, "Milestone 03 Label cannot be empty.");
          if (!currentEra) return fail(key, "Current Era Label cannot be empty.");

          const milestoneObj = { milestone01, milestone02, milestone03, currentEra };
          if (milestoneObj !== null && milestoneObj !== undefined && typeof milestoneObj === "object") {
            for (const [name, val] of Object.entries(milestoneObj)) {
              if (/[\u2014\u2013]/.test(val)) {
                return fail(key, `Label "${name}" contains an em dash.`);
              }
            }
          }

          payload[key] = {
            milestone01,
            milestone02,
            milestone03,
            currentEra,
          };
        } catch {
          return fail(key, "Invalid JSON for milestone labels.");
        }
        continue;
      }

      if (key === "milestone01Label" || key === "milestone02Label" || key === "milestone03Label" || key === "currentEraLabel") {
        if (/[\u2014\u2013]/.test(trimmed)) {
          return fail(key, `Field "${key}" contains an em dash.`);
        }
        const fieldName = key === "milestone01Label"
          ? "milestone01"
          : key === "milestone02Label"
          ? "milestone02"
          : key === "milestone03Label"
          ? "milestone03"
          : "currentEra";
        if (!payload.milestoneLabels || typeof payload.milestoneLabels !== "object") {
          payload.milestoneLabels = {};
        }
        payload.milestoneLabels[fieldName] = trimmed.slice(0, 80);
        continue;
      }

      if (key === "principles") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Principles must be an array.");
          }
          if (parsed.length > 20) {
            return fail(key, "Principles cannot exceed 20 entries.");
          }
          const cleanedPrinciples = [];
          for (let i = 0; i < parsed.length; i++) {
            const p = parsed[i];
            if (!p || typeof p !== "object") continue;
            const title = String(p.title || "").trim();
            const statement = String(p.statement || "").trim();
            if (!title) {
              return fail(key, `Principle #${i + 1} must have a title.`);
            }
            const number = String(p.number || `0${i + 1}`).trim().slice(0, 10);
            const rawIcon = String(p.icon || "layers").trim().toLowerCase();
            const icon = ALLOWED_ICON_IDS.has(rawIcon) ? rawIcon : "layers";
            const displayOrder = typeof p.displayOrder === "number" ? p.displayOrder : i + 1;

            cleanedPrinciples.push({
              id: String(p.id || `principle-${i + 1}`).trim().slice(0, 40),
              number,
              title: title.slice(0, 60),
              statement: statement.slice(0, 200),
              icon,
              displayOrder,
            });
          }
          payload[key] = cleanedPrinciples;
        } catch {
          return fail(key, "Invalid JSON for principles.");
        }
        continue;
      }

      if (key === "focusAreas") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return fail(key, "Focus areas must be an array.");
          }
          if (parsed.length > 20) {
            return fail(key, "Focus areas cannot exceed 20 entries.");
          }
          const cleanedFocus = [];
          for (let i = 0; i < parsed.length; i++) {
            const f = parsed[i];
            if (!f || typeof f !== "object") continue;
            const title = String(f.title || "").trim();
            const description = String(f.description || "").trim();
            if (!title) {
              return fail(key, `Focus area #${i + 1} must have a title.`);
            }
            const rawIcon = String(f.icon || "terminal").trim().toLowerCase();
            const icon = ALLOWED_ICON_IDS.has(rawIcon) ? rawIcon : "terminal";
            const displayOrder = typeof f.displayOrder === "number" ? f.displayOrder : i + 1;

            cleanedFocus.push({
              id: String(f.id || `focus-${i + 1}`).trim().slice(0, 40),
              title: title.slice(0, 60),
              description: description.slice(0, 300),
              icon,
              displayOrder,
            });
          }
          payload[key] = cleanedFocus;
        } catch {
          return fail(key, "Invalid JSON for focus areas.");
        }
        continue;
      }

      if (section === "resume" && RESUME_LABEL_KEYS.has(key) && trimmed.length > 40) {
        return fail(key, `Resume label "${key}" cannot exceed 40 characters.`);
      }

      const maxLength = LONG_FIELDS.has(key) ? 5000 : 300;
      if (trimmed.length > maxLength) {
        return fail(key, `Field "${key}" exceeds the maximum length of ${maxLength} characters.`);
      }

      payload[key] = trimmed;
    }
  }


  return { ok: true, payload };
}

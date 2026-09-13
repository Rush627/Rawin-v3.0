"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import {
  updateSiteSection,
  type ContentSectionKey,
} from "@/lib/site-content";

export interface ContentActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

const ALLOWED_SECTIONS: ContentSectionKey[] = [
  "global",
  "home",
  "about",
  "contact",
  "resume",
  "uses",
  "ai",
];

const SECTION_ALLOWED_KEYS: Record<ContentSectionKey, string[]> = {
  global: [
    "brandName",
    "siteTitle",
    "shortBio",
    "availabilityStatus",
    "availabilityBadge",
    "footerCopyright",
    "contactEmail",
    "location",
  ],
  home: [
    "heroStatus",
    "heroBadge",
    "heroTitlePrefix",
    "heroName",
    "heroBio",
    "heroPrimaryCtaText",
    "heroSecondaryCtaText",
    "featuredHeading",
    "featuredDescription",
  ],
  about: [
    "eyebrow",
    "title",
    "subtitle",
    "leadText",
    "narrativeText",
    "journeyHeading",
    "journeyDescription",
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
  ],
  resume: [
    "eyebrow",
    "title",
    "subtitle",
    "summary",
    "ctaText",
    "contact",
    "status",
    "skills",
    "experience",
    "education",
    "cta",
  ],
  uses: [
    "eyebrow",
    "title",
    "description",
    "updatedYear",
    "developmentStack",
    "currentlyExploring",
    "mySetup",
  ],
  ai: [
    "eyebrow",
    "title",
    "description",
    "greetingMessage",
    "inputPlaceholder",
  ],
  assets: [
    "profilePhoto",
    "logo",
    "favicon",
  ],
  maintenance: [
    "enabled",
    "showMessage",
    "message",
    "endsAt",
  ],
};

const LONG_FIELDS = new Set([
  "shortBio",
  "heroBio",
  "leadText",
  "narrativeText",
  "description",
  "summary",
  "successMessage",
  "greetingMessage",
  "developmentStack",
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
]);

const ALLOWED_ICON_IDS = new Set([
  "",
  "layers",
  "code",
  "cpu",
  "palette",
  "database",
  "zap",
  "activity",
  "compass",
  "git",
  "terminal",
  "bot",
  "globe",
  "sparkles",
  "radio",
  "flame",
  "laptop",
  "workflow",
]);

/**
 * Server action to update a specific section of site content.
 */
export async function updateSectionAction(
  section: ContentSectionKey,
  prevState: ContentActionState | null,
  formData: FormData
): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  if (!ALLOWED_SECTIONS.includes(section)) {
    return { error: `Invalid content section: "${section}".` };
  }

  const allowedKeys = SECTION_ALLOWED_KEYS[section];
  const payload: Record<string, any> = {};

  for (const key of allowedKeys) {
    const rawVal = formData.get(key);
    if (typeof rawVal === "string") {
      const trimmed = rawVal.trim();

      // Disallow em dashes
      if (/[\u2014\u2013]/.test(trimmed)) {
        return {
          error: `Field "${key}" contains an em dash. Please use hyphens or middle dots (·) instead.`,
        };
      }

      if (key === "updatedYear") {
        if (!/^\d{4}$/.test(trimmed)) {
          return { error: "Updated year must be a valid 4-digit year (e.g. 2026)." };
        }
        payload[key] = trimmed;
        continue;
      }

      if (key === "developmentStack") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return { error: "Development stack must be an array." };
          }
          if (parsed.length > 30) {
            return { error: "Development stack cannot exceed 30 items." };
          }
          const cleanedItems = [];
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const name = String(item.name || "").trim();
            const description = String(item.description || "").trim();
            const category = String(item.category || "").trim();
            const icon = String(item.icon || "").trim().toLowerCase();
            if (icon && !ALLOWED_ICON_IDS.has(icon)) {
              return { error: `Invalid icon "${icon}" for item "${name}".` };
            }
            const displayOrder = typeof item.displayOrder === "number" ? item.displayOrder : 999;
            if (!name) return { error: "Each development stack item must have a name." };
            if (name.length > 60) return { error: `Item "${name.slice(0, 20)}..." name exceeds 60 characters.` };
            if (description.length > 300) return { error: `Item "${name}" description exceeds 300 characters.` };
            if (category.length > 50) return { error: `Item "${name}" category exceeds 50 characters.` };
            cleanedItems.push({ name, description, category, icon, displayOrder });
          }
          payload[key] = cleanedItems;
        } catch {
          return { error: "Invalid JSON for development stack." };
        }
        continue;
      }

      if (key === "currentlyExploring") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return { error: "Currently exploring must be an array." };
          }
          if (parsed.length > 30) {
            return { error: "Currently exploring cannot exceed 30 items." };
          }
          const cleanedItems = [];
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const name = String(item.name || "").trim();
            const description = String(item.description || "").trim();
            const category = String(item.category || "").trim();
            const icon = String(item.icon || "").trim().toLowerCase();
            if (icon && !ALLOWED_ICON_IDS.has(icon)) {
              return { error: `Invalid icon "${icon}" for item "${name}".` };
            }
            const displayOrder = typeof item.displayOrder === "number" ? item.displayOrder : 999;
            if (!name) return { error: "Each currently exploring item must have a name." };
            if (name.length > 60) return { error: `Item "${name.slice(0, 20)}..." name exceeds 60 characters.` };
            if (description.length > 300) return { error: `Item "${name}" description exceeds 300 characters.` };
            if (category.length > 50) return { error: `Item "${name}" category exceeds 50 characters.` };
            cleanedItems.push({ name, description, category, icon, displayOrder });
          }
          payload[key] = cleanedItems;
        } catch {
          return { error: "Invalid JSON for currently exploring." };
        }
        continue;
      }

      if (key === "mySetup") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "My Setup must be an object." };
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
          return { error: "Invalid JSON for My Setup." };
        }
        continue;
      }

      if (key === "contact") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "Contact must be an object." };
          }
          const email = String(parsed.email || "").trim();
          const website = String(parsed.website || "").trim();
          const location = String(parsed.location || "").trim();

          if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email) || email.length > 100) {
              return { error: "Please provide a valid email address." };
            }
          }
          if (website) {
            try {
              const u = new URL(website);
              if (u.protocol !== "http:" && u.protocol !== "https:") {
                return { error: "Website must begin with http:// or https://" };
              }
            } catch {
              return { error: "Please provide a valid website URL." };
            }
            if (website.length > 200) {
              return { error: "Website URL exceeds 200 characters." };
            }
          }
          if (location.length > 100) {
            return { error: "Location exceeds 100 characters." };
          }

          payload[key] = {
            location: location.slice(0, 100),
            email: email.slice(0, 100),
            website: website.slice(0, 200),
          };
        } catch {
          return { error: "Invalid JSON for contact information." };
        }
        continue;
      }

      if (key === "socials") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "Social channels must be an object." };
          }
          const github = String(parsed.github || "").trim();
          const linkedin = String(parsed.linkedin || "").trim();
          const twitter = String(parsed.twitter || "").trim();

          const channels = [
            { name: "GitHub", url: github },
            { name: "LinkedIn", url: linkedin },
            { name: "X / Twitter", url: twitter },
          ];

          for (const channel of channels) {
            if (channel.url) {
              if (channel.url.length > 250) {
                return { error: `${channel.name} URL cannot exceed 250 characters.` };
              }
              try {
                const u = new URL(channel.url);
                if (u.protocol !== "http:" && u.protocol !== "https:") {
                  return { error: `${channel.name} URL must begin with http:// or https://` };
                }
              } catch {
                return { error: `Please provide a valid URL for ${channel.name}.` };
              }
            }
          }

          payload[key] = {
            github: github.slice(0, 250),
            linkedin: linkedin.slice(0, 250),
            twitter: twitter.slice(0, 250),
          };
        } catch {
          return { error: "Invalid JSON for social channels." };
        }
        continue;
      }

      if (key === "form") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "Form placeholders must be an object." };
          }
          payload[key] = {
            namePlaceholder: String(parsed.namePlaceholder || "").trim().slice(0, 150),
            emailPlaceholder: String(parsed.emailPlaceholder || "").trim().slice(0, 150),
            phonePlaceholder: String(parsed.phonePlaceholder || "").trim().slice(0, 150),
            subjectPlaceholder: String(parsed.subjectPlaceholder || "").trim().slice(0, 150),
            messagePlaceholder: String(parsed.messagePlaceholder || "").trim().slice(0, 150),
          };
        } catch {
          return { error: "Invalid JSON for form placeholders." };
        }
        continue;
      }

      if (key === "email") {
        if (trimmed) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmed) || trimmed.length > 100) {
            return { error: "Please provide a valid email address." };
          }
        }
        payload[key] = trimmed.slice(0, 100);
        continue;
      }

      if (key === "phone") {
        if (trimmed.length > 40) {
          return { error: "Phone number cannot exceed 40 characters." };
        }
        payload[key] = trimmed.slice(0, 40);
        continue;
      }

      if (key === "showPhoneNumber") {
        payload[key] = trimmed === "true" || trimmed === "1" || trimmed === "on";
        continue;
      }

      if (key === "location" && section === "contact") {
        if (trimmed.length > 120) {
          return { error: "Location cannot exceed 120 characters." };
        }
        payload[key] = trimmed.slice(0, 120);
        continue;
      }

      if (key === "status") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "Status must be an object." };
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
          return { error: "Invalid JSON for working status." };
        }
        continue;
      }

      if (key === "skills") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return { error: "Skills must be an array of skill groups." };
          }
          if (parsed.length > 20) {
            return { error: "Skill groups cannot exceed 20 categories." };
          }
          const cleanedGroups = [];
          for (let i = 0; i < parsed.length; i++) {
            const group = parsed[i];
            if (!group || typeof group !== "object") continue;
            const title = String(group.title || "").trim();
            if (!title) {
              return { error: `Skill group #${i + 1} must have a title.` };
            }
            if (title.length > 60) {
              return { error: `Skill group "${title.slice(0, 20)}..." title exceeds 60 characters.` };
            }

            const rawSkills = Array.isArray(group.skills) ? group.skills : [];
            if (rawSkills.length > 30) {
              return { error: `Skill group "${title}" cannot exceed 30 skills.` };
            }
            const cleanedSkills = [];
            for (const s of rawSkills) {
              const skillName = String(s || "").trim();
              if (skillName) {
                if (skillName.length > 50) {
                  return { error: `Skill "${skillName.slice(0, 20)}..." exceeds 50 characters.` };
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
          return { error: "Invalid JSON for skills." };
        }
        continue;
      }

      if (key === "experience") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return { error: "Experience must be an array of timeline items." };
          }
          if (parsed.length > 20) {
            return { error: "Experience items cannot exceed 20 entries." };
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const role = String(item.role || "").trim();
            const organization = String(item.organization || "").trim();
            if (!role) {
              return { error: `Experience item #${i + 1} must have a role title.` };
            }
            if (!organization) {
              return { error: `Experience item #${i + 1} must have an organization name.` };
            }
            if (role.length > 80) return { error: `Role "${role.slice(0, 20)}..." exceeds 80 characters.` };
            if (organization.length > 80) return { error: `Organization "${organization.slice(0, 20)}..." exceeds 80 characters.` };

            const startDate = String(item.startDate || "").trim().slice(0, 20);
            const endDate = String(item.endDate || "").trim().slice(0, 20);
            const current = Boolean(item.current);
            const location = String(item.location || "").trim().slice(0, 60);

            const rawBullets = Array.isArray(item.bullets) ? item.bullets : [];
            if (rawBullets.length > 10) {
              return { error: `Experience "${role}" cannot exceed 10 bullet points.` };
            }
            const cleanedBullets = [];
            for (const b of rawBullets) {
              const bullet = String(b || "").trim();
              if (bullet) {
                if (bullet.length > 300) {
                  return { error: `Bullet in "${role}" exceeds 300 characters.` };
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
          return { error: "Invalid JSON for experience." };
        }
        continue;
      }

      if (key === "education") {
        try {
          const parsed = JSON.parse(trimmed || "[]");
          if (!Array.isArray(parsed)) {
            return { error: "Education must be an array." };
          }
          if (parsed.length > 10) {
            return { error: "Education items cannot exceed 10 entries." };
          }
          const cleanedItems = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== "object") continue;
            const degree = String(item.degree || "").trim();
            const institution = String(item.institution || "").trim();
            if (!degree) {
              return { error: `Education item #${i + 1} must have a degree/program.` };
            }
            if (!institution) {
              return { error: `Education item #${i + 1} must have an institution name.` };
            }
            if (degree.length > 100) return { error: `Degree "${degree.slice(0, 20)}..." exceeds 100 characters.` };
            if (institution.length > 100) return { error: `Institution "${institution.slice(0, 20)}..." exceeds 100 characters.` };

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
          return { error: "Invalid JSON for education." };
        }
        continue;
      }

      if (key === "cta") {
        try {
          const parsed = JSON.parse(trimmed || "{}");
          if (!parsed || typeof parsed !== "object") {
            return { error: "CTA must be an object." };
          }
          payload[key] = {
            heading: String(parsed.heading || "").trim().slice(0, 100),
            description: String(parsed.description || "").trim().slice(0, 300),
            buttonText: String(parsed.buttonText || "").trim().slice(0, 40),
          };
        } catch {
          return { error: "Invalid JSON for CTA." };
        }
        continue;
      }

      const maxLength = LONG_FIELDS.has(key) ? 5000 : 300;
      if (trimmed.length > maxLength) {
        return {
          error: `Field "${key}" exceeds the maximum length of ${maxLength} characters.`,
        };
      }

      payload[key] = trimmed;
    }
  }

  try {
    await updateSiteSection(section, payload as any);

  } catch (err: unknown) {
    console.error(`[SiteContent Action Error] Unexpected failure updating section "${section}":`, err);
    return { error: "An unexpected error occurred while saving content. Please try again." };
  }

  // Revalidate public pages and admin content editor
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/resume");
  revalidatePath("/uses");
  revalidatePath("/ai");
  revalidatePath("/admin/content");

  const sectionDisplayName = section.charAt(0).toUpperCase() + section.slice(1);
  return {
    success: true,
    message: `${sectionDisplayName} content saved successfully.`,
  };
}

const ASSET_SIZE_LIMITS: Record<string, number> = {
  profilePhoto: 5 * 1024 * 1024, // 5MB
  logo: 2 * 1024 * 1024,         // 2MB
  favicon: 1 * 1024 * 1024,      // 1MB
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  profilePhoto: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/png", "image/webp"],
  favicon: ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/webp"],
};

/**
 * Server action to update, upload, or reset site visual identity assets.
 */
export async function updateAssetAction(
  formData: FormData
): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const assetType = formData.get("assetType") as "profilePhoto" | "logo" | "favicon";
  const action = formData.get("action") as "upload" | "updateMeta" | "reset";

  if (!assetType || !["profilePhoto", "logo", "favicon"].includes(assetType)) {
    return { error: "Invalid asset category specified." };
  }

  const {
    storeAssetFile,
    updateSiteAssetMeta,
    resetAssetToDefault,
  } = await import("@/lib/site-content");

  const assetLabels: Record<string, string> = {
    profilePhoto: "Profile Photo",
    logo: "Website Logo",
    favicon: "Website Favicon",
  };
  const label = assetLabels[assetType] || assetType;

  // 1. Reset Action
  if (action === "reset") {
    try {
      await resetAssetToDefault(assetType);
      revalidateAllAssetPaths();
      return { success: true, message: `${label} has been reset to default.` };
    } catch (err: unknown) {
      console.error(`[SiteContent Action Error] Unexpected failure resetting asset "${assetType}":`, err);
      return { error: `Failed to reset ${label}. An unexpected error occurred.` };
    }
  }

  // 2. Direct Metadata Update (e.g. direct URL / alt text)
  if (action === "updateMeta") {
    const rawUrl = formData.get("url");
    const rawAlt = formData.get("alt");

    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    const alt = typeof rawAlt === "string" ? rawAlt.trim() : "";

    if (url && url.length > 500) {
      return { error: "Asset URL exceeds maximum length of 500 characters." };
    }
    // Block dangerous protocols in direct URLs
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.startsWith("javascript:") ||
      lowerUrl.startsWith("data:") ||
      lowerUrl.startsWith("vbscript:")
    ) {
      return { error: "Unsafe URL protocol rejected. Please provide a valid HTTP/HTTPS or local path." };
    }

    if (alt && alt.length > 200) {
      return { error: "Alt text exceeds maximum length of 200 characters." };
    }

    try {
      await updateSiteAssetMeta(assetType, {
        url: url || undefined,
        alt: alt || undefined,
      });
      revalidateAllAssetPaths();
      return { success: true, message: `${label} metadata saved successfully.` };
    } catch (err: unknown) {
      console.error(`[SiteContent Action Error] Unexpected failure saving metadata for "${assetType}":`, err);
      return { error: `Failed to save ${label} metadata. An unexpected error occurred.` };
    }
  }

  // 3. File Upload Action
  if (action === "upload") {
    const file = formData.get("file") as File | null;
    const rawAlt = formData.get("alt");
    const alt = typeof rawAlt === "string" ? rawAlt.trim() : undefined;

    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: "Please select an image file to upload." };
    }

    // Validate size limit
    const sizeLimit = ASSET_SIZE_LIMITS[assetType] || 2 * 1024 * 1024;
    if (file.size > sizeLimit) {
      const mbLimit = (sizeLimit / (1024 * 1024)).toFixed(0);
      return { error: `File size exceeds the allowed limit of ${mbLimit}MB for ${label}.` };
    }

    // Validate MIME type
    const allowedMimes = ALLOWED_MIME_TYPES[assetType] || [];
    const fileType = file.type.toLowerCase();
    if (!allowedMimes.includes(fileType)) {
      return {
        error: `Unsupported file format (${fileType || "unknown"}). Allowed formats: ${allowedMimes.join(", ")}.`,
      };
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Sanitize filename: alphanumeric, dashes, dots
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-60);

      await storeAssetFile(assetType, buffer, fileType, sanitizedName, alt);
      revalidateAllAssetPaths();

      return {
        success: true,
        message: `${label} uploaded and updated across the site successfully.`,
      };
    } catch (err: unknown) {
      console.error(`[SiteContent Action Error] Unexpected failure uploading "${assetType}":`, err);
      return { error: `Failed to upload ${label}. An unexpected error occurred.` };
    }
  }

  return { error: "Invalid asset operation." };
}

function revalidateAllAssetPaths() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/resume");
  revalidatePath("/uses");
  revalidatePath("/ai");
  revalidatePath("/admin");
  revalidatePath("/admin/login");
  revalidatePath("/admin/content");
}

/**
 * Server action to upload a resume PDF into GridFS.
 */
export async function uploadResumePdfAction(
  formData: FormData
): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Please select a PDF file to upload." };
  }

  // 1. Max size: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Resume PDF file size exceeds the 10MB limit." };
  }

  // 2. MIME validation
  const mime = file.type.toLowerCase();
  if (mime !== "application/pdf") {
    return { error: `Invalid file type (${mime || "unknown"}). Only PDF files are allowed.` };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Magic bytes validation: %PDF-
    if (
      buffer.length < 5 ||
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46 ||
      buffer[4] !== 0x2d
    ) {
      return { error: "Corrupted or invalid PDF file header." };
    }

    const { storeResumePdfFile } = await import("@/lib/site-content");
    const result = await storeResumePdfFile(buffer, file.name, file.size);

    revalidatePath("/resume");
    revalidatePath("/admin/content");

    return {
      success: true,
      message: `Resume PDF (${result.filename}) uploaded and published successfully.`,
    };
  } catch (err: unknown) {
    console.error("[Resume PDF Upload Action Error]:", err);
    const msg = err instanceof Error ? err.message : "Failed to upload resume PDF.";
    return { error: msg };
  }
}

/**
 * Server action to remove the current resume PDF from GridFS.
 */
export async function removeResumePdfAction(): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  try {
    const { removeResumePdfFile } = await import("@/lib/site-content");
    await removeResumePdfFile();

    revalidatePath("/resume");
    revalidatePath("/admin/content");

    return {
      success: true,
      message: "Resume PDF has been removed. The download button is now hidden on the public resume.",
    };
  } catch (err: unknown) {
    console.error("[Resume PDF Remove Action Error]:", err);
    return { error: "Failed to remove resume PDF. Please try again." };
  }
}


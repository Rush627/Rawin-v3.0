import { getSiteContent } from "@/lib/site-content";
import { getProjects } from "@/lib/projects";
import { PROJECTS as canonicalProjects } from "@/data/projects";
import { getPublishedPosts } from "@/lib/blog";
import { getActiveOrbitKnowledgeForAura } from "@/lib/orbit-knowledge";
import { getDatabase } from "@/lib/mongodb";

let cachedKnowledge: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute max TTL fallback

/**
 * Invalidates the in-memory knowledge cache immediately.
 * Called upon CMS updates so subsequent requests retrieve fresh data without rebuild/restart.
 */
export function invalidateAuraKnowledgeCache(): void {
  cachedKnowledge = null;
  lastCacheTime = 0;
}

export async function getAuraKnowledgeContext(): Promise<string> {
  const now = Date.now();

  // Fast path: if cache exists and is fresh within 3 seconds, serve from memory
  if (cachedKnowledge && now - lastCacheTime < 3000) {
    return cachedKnowledge;
  }

  // If cache is active, verify against latest orbit_knowledge update timestamp
  if (cachedKnowledge && now - lastCacheTime < CACHE_TTL_MS) {
    const activeCache = cachedKnowledge;
    try {
      const db = await getDatabase();
      if (db) {
        const latestDoc = await db
          .collection("orbit_knowledge")
          .find({}, { projection: { updatedAt: 1 } })
          .sort({ updatedAt: -1 })
          .limit(1)
          .toArray();

        if (latestDoc.length > 0 && latestDoc[0].updatedAt) {
          const docUpdateTime = new Date(latestDoc[0].updatedAt).getTime();
          if (docUpdateTime > lastCacheTime) {
            // Document was updated after last cache compilation: invalidate
            cachedKnowledge = null;
          } else {
            return activeCache;
          }
        } else {
          return activeCache;
        }
      }
    } catch {
      return activeCache;
    }
  }

  try {
    const [content, dbProjects, posts, manualKnowledge] = await Promise.all([
      getSiteContent(),
      getProjects().catch(() => []),
      getPublishedPosts().catch(() => []),
      getActiveOrbitKnowledgeForAura().catch(() => []),
    ]);

    const sections: string[] = [];

    // 1. Site and Creator Semantics
    sections.push("[SITE & CREATOR]");
    sections.push("RAWIN Founder & Developer: Rushan Siddiqui");
    sections.push("Platform: RAWIN (personal engineering ecosystem and portfolio, current version RAWIN v3.0)");
    sections.push("AI: Rawin Orbit (short name: Orbit)");
    sections.push("Relationship: Rushan Siddiqui founded RAWIN and is Orbit's developer. Orbit is an AI assistant created by Rushan for RAWIN.");
    sections.push("Role: Software Developer / Full Stack Engineer");
    sections.push(`Location: ${content.global?.location || "Uttar Pradesh, India"}`);
    sections.push(`Availability: ${content.global?.availabilityStatus || "Open to select opportunities"}`);

    // 2. About Summary
    if (content.about?.leadText || content.about?.narrativeText || content.global?.shortBio) {
      sections.push("\n[ABOUT]");
      if (content.global?.shortBio) {
        sections.push(`Bio: ${content.global.shortBio}`);
      }
      if (content.about?.leadText) {
        sections.push(`Focus: ${content.about.leadText}`);
      }
      if (content.about?.narrativeText) {
        // Keep concise summary of narrative without essay bloat
        const conciseNarrative = content.about.narrativeText.slice(0, 400);
        sections.push(`Narrative: ${conciseNarrative}`);
      }
    }

    // 3. Technical Skills
    sections.push("\n[SKILLS]");
    if (content.resume?.skills && content.resume.skills.length > 0) {
      for (const group of content.resume.skills) {
        sections.push(`- ${group.title}: ${group.skills.join(", ")}`);
      }
    } else {
      sections.push("- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion");
      sections.push("- Backend & APIs: Node.js, REST APIs, Server Actions, Edge Handlers");
      sections.push("- Data & Storage: MongoDB, GridFS, PostgreSQL, Cloudflare");
      sections.push("- Tooling: Git, GitHub, Turbopack, ESLint");
    }

    // 4. Resume (Experience & Education)
    const hasExp = content.resume?.experience && content.resume.experience.length > 0;
    const hasEdu = content.resume?.education && content.resume.education.length > 0;
    if (hasExp || hasEdu) {
      sections.push("\n[RESUME]");
      if (hasExp) {
        sections.push("Experience:");
        for (const exp of content.resume!.experience!) {
          const time = `${exp.startDate} to ${exp.current ? "Present" : exp.endDate}`;
          sections.push(`- ${exp.role} at ${exp.organization} (${time})`);
          if (exp.bullets && exp.bullets.length > 0) {
            sections.push(`  Highlights: ${exp.bullets.slice(0, 3).join("; ")}`);
          }
        }
      }
      if (hasEdu) {
        sections.push("Education:");
        for (const edu of content.resume!.education!) {
          sections.push(`- ${edu.degree} from ${edu.institution}`);
        }
      }
    }

    // 5. Featured Projects (Strictly Canonical: RAWIN v3.0, Strata Commerce, Rawin Horizon, Rawin Orbit)
    const activeProjects = canonicalProjects.map((cp) => {
      // Find matching dbProject if available to augment
      const match = dbProjects.find(
        (p) =>
          p.slug === cp.slug ||
          p.title.toLowerCase().includes(cp.title.toLowerCase()) ||
          (cp.slug === "strata-commerce" && p.slug.includes("zenith")) ||
          (cp.slug === "rawin-horizon" && p.slug.includes("pulse"))
      );
      if (match) {
        return {
          title: cp.title,
          slug: cp.slug,
          category: cp.category,
          status: match.status || "completed",
          tagline: match.tagline || cp.tagline,
          description: match.description || cp.description,
          technologies: match.technologies?.length ? match.technologies : cp.technologies,
          solution: match.solution || cp.solution,
        };
      }
      return {
        title: cp.title,
        slug: cp.slug,
        category: cp.category,
        status: "completed",
        tagline: cp.tagline,
        description: cp.description,
        technologies: cp.technologies,
        solution: cp.solution,
      };
    });

    sections.push("\n[PROJECTS]");
    for (const p of activeProjects) {
      const techStr = p.technologies?.slice(0, 6).join(", ") || "";
      sections.push(`- ${p.title} (${p.category || "Full Stack"}, Status: ${p.status})`);
      if (p.tagline) sections.push(`  Tagline: ${p.tagline}`);
      if (p.description) sections.push(`  Summary: ${p.description.slice(0, 160)}`);
      if (techStr) sections.push(`  Tech: ${techStr}`);
      if (p.solution) sections.push(`  Solution: ${p.solution.slice(0, 160)}`);
      sections.push(`  Link: /projects/${p.slug}`);
    }

    // 6. Published Blog Articles
    if (posts && posts.length > 0) {
      sections.push("\n[BLOG]");
      for (const post of posts) {
        sections.push(`- "${post.title}" (/blog/${post.slug})`);
        if (post.excerpt) sections.push(`  Summary: ${post.excerpt.slice(0, 140)}`);
        if (post.tags && post.tags.length > 0) sections.push(`  Tags: ${post.tags.slice(0, 4).join(", ")}`);
      }
    }

    // 7. Contact
    sections.push("\n[CONTACT]");
    sections.push(`Email: ${content.contact?.email || content.global?.contactEmail || "rushansiddiqui5262@gmail.com"}`);
    if (content.contact?.showPhoneNumber && content.contact?.phone) {
      sections.push(`Phone: ${content.contact.phone}`);
    }
    if (content.contact?.socials) {
      const { github, linkedin, twitter } = content.contact.socials;
      if (github) sections.push(`GitHub: ${github}`);
      if (linkedin) sections.push(`LinkedIn: ${linkedin}`);
      if (twitter) sections.push(`X: ${twitter}`);
    }
    sections.push("Direct Contact Page: /contact");

    // 8. Authoritative Manual Knowledge (Managed via Orbit Knowledge CMS)
    if (manualKnowledge && manualKnowledge.length > 0) {
      sections.push("\n[AUTHORITATIVE ORBIT KNOWLEDGE]");
      sections.push("The following verified knowledge was entered directly by Rushan Siddiqui via the Admin CMS:");

      const categoryLabels: Record<string, string> = {
        profile: "Personal & Profile",
        education: "Education",
        skills: "Skills & Technologies",
        rawin: "RAWIN Platform",
        orbit: "Rawin Orbit AI",
        custom: "Custom Facts & Directives",
      };

      for (const item of manualKnowledge) {
        const catLabel = categoryLabels[item.category] || item.category.toUpperCase();
        const statusLabel = item.status === "current" ? "CURRENT" : "HISTORICAL";
        const priorityLabel = item.priority === "high" ? " [HIGH PRIORITY]" : "";
        sections.push(`\n- [${catLabel}] ${item.title} (Status: ${statusLabel}${priorityLabel}):`);
        sections.push(`  ${item.content.trim().split("\n").join("\n  ")}`);
      }
    }

    cachedKnowledge = sections.join("\n");
    lastCacheTime = now;
    return cachedKnowledge;
  } catch (error) {
    console.error("[Orbit] Error compiling knowledge context:", error);
    return "[SITE & CREATOR]\nRAWIN Founder & Developer: Rushan Siddiqui\nPlatform: RAWIN 3.0\nAI: RAWIN ORBIT\nRelationship: Rushan Siddiqui founded RAWIN and is Orbit's developer.\nInquiries: /contact";
  }
}

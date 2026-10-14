import type { SiteContent } from "../site-content";
import type { Project } from "../projects";
import type { BlogPost } from "../blog";
import type { OrbitKnowledgeItem } from "../orbit-knowledge";

/**
 * Orbit's knowledge context, compiled from the same records the public site renders. Pure: the
 * caller supplies the records (null = that source could not be read), so this is unit-tested.
 *
 *  - Current projects: every saved project (all of them are listed on /projects).
 *  - Current articles: the published articles (what /blog lists).
 *  - Historical entries (knowledge with status "historical") are listed separately and never
 *    count as current; one is dropped when a current project or article has the same identity
 *    again (restored or recreated), so a restored record always wins.
 *  - A source that failed is reported as unavailable, never as empty.
 */

export interface AuraSources {
  content: SiteContent;
  projects: Project[] | null;
  posts: BlogPost[] | null;
  knowledge: OrbitKnowledgeItem[] | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  profile: "Personal & Profile",
  education: "Education",
  skills: "Skills & Technologies",
  rawin: "RAWIN Platform",
  orbit: "Rawin Orbit AI",
  custom: "Custom Facts & Directives",
};

/** Identity used to match a historical entry against current records. */
export function identityOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/\((former|removed)[^)]*\)/g, "")
    .replace(/["'“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dateOnly(value?: string) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
}

export function compileAuraContext({ content, projects, posts, knowledge }: AuraSources): string {
  const sections: string[] = [];

  sections.push("[SITE & CREATOR]");
  sections.push("RAWIN Founder & Developer: Rushan Siddiqui");
  sections.push("Platform: RAWIN (personal engineering ecosystem and portfolio, current version RAWIN v3.0)");
  sections.push("AI: Rawin Orbit (short name: Orbit)");
  sections.push("Relationship: Rushan Siddiqui founded RAWIN and is Orbit's developer. Orbit is an AI assistant created by Rushan for RAWIN.");
  sections.push("Role: Software Developer / Full Stack Engineer");
  sections.push(`Location: ${content.contact.location}`);
  const availability = content.availability;
  sections.push(`Availability: ${availability.label}${availability.note ? ` (${availability.note})` : ""}`);

  if (content.about?.leadText || content.about?.narrativeText || content.global?.shortBio) {
    sections.push("\n[ABOUT]");
    if (content.global?.shortBio) sections.push(`Bio: ${content.global.shortBio}`);
    if (content.about?.leadText) sections.push(`Focus: ${content.about.leadText}`);
    if (content.about?.narrativeText) sections.push(`Narrative: ${content.about.narrativeText.slice(0, 400)}`);
  }

  sections.push("\n[SKILLS]");
  if (content.resume?.skills && content.resume.skills.length > 0) {
    for (const group of content.resume.skills) sections.push(`- ${group.title}: ${group.skills.join(", ")}`);
  } else {
    sections.push("- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion");
    sections.push("- Backend & APIs: Node.js, REST APIs, Server Actions, Edge Handlers");
    sections.push("- Data & Storage: MongoDB, GridFS, PostgreSQL, Cloudflare");
    sections.push("- Tooling: Git, GitHub, Turbopack, ESLint");
  }

  const experience = content.resume?.experience ?? [];
  const education = content.resume?.education ?? [];
  if (experience.length || education.length) {
    sections.push("\n[RESUME]");
    if (experience.length) {
      sections.push("Experience:");
      for (const exp of experience) {
        sections.push(`- ${exp.role} at ${exp.organization} (${exp.startDate} to ${exp.current ? "Present" : exp.endDate})`);
        if (exp.bullets?.length) sections.push(`  Highlights: ${exp.bullets.slice(0, 3).join("; ")}`);
      }
    }
    if (education.length) {
      sections.push("Education:");
      for (const edu of education) sections.push(`- ${edu.degree} from ${edu.institution}`);
    }
  }

  // Current projects: exactly the records listed on /projects (public fields only)
  sections.push("\n[CURRENT PROJECTS]");
  if (!projects) {
    sections.push("The current project list could not be loaded right now. Do not name, count or describe specific projects; point visitors to /projects.");
  } else if (projects.length === 0) {
    sections.push("No projects are listed right now.");
  } else {
    sections.push(`Current project count: ${projects.length}. These are the only current projects.`);
    for (const p of projects) {
      const status = p.status === "in-progress" ? "in development" : p.status;
      sections.push(`- ${p.title} (${p.category || "Project"}${p.year ? `, ${p.year}` : ""}, status: ${status}${p.featured ? ", featured" : ""})`);
      if (p.tagline) sections.push(`  Tagline: ${p.tagline}`);
      if (p.description) sections.push(`  Summary: ${p.description.slice(0, 220)}`);
      const tech = p.technologies?.slice(0, 6).join(", ");
      if (tech) sections.push(`  Tech: ${tech}`);
      if (p.solution) sections.push(`  Approach: ${p.solution.slice(0, 160)}`);
      if (p.liveUrl) sections.push(`  Live: ${p.liveUrl}`);
      if (p.githubUrl) sections.push(`  Source: ${p.githubUrl}`);
      sections.push(`  Case study: /projects/${p.slug}`);
    }
  }

  // Current articles: the published articles listed on /blog
  sections.push("\n[CURRENT ARTICLES]");
  if (!posts) {
    sections.push("The article list could not be loaded right now. Do not name or describe specific articles; point visitors to /blog.");
  } else if (posts.length === 0) {
    sections.push("No articles are published right now.");
  } else {
    sections.push(`Published article count: ${posts.length}. These are the only currently published articles.`);
    for (const post of posts) {
      const date = dateOnly(post.publishedAt);
      sections.push(`- "${post.title}" (/blog/${post.slug}${date ? `, published ${date}` : ""})`);
      if (post.excerpt) sections.push(`  Summary: ${post.excerpt.slice(0, 160)}`);
      if (post.tags?.length) sections.push(`  Tags: ${post.tags.slice(0, 4).join(", ")}`);
    }
  }

  sections.push("\n[CONTACT]");
  sections.push(`Email: ${content.contact.email}`);
  // the phone number is shared only when it is shown publicly on the site
  if (content.contact?.showPhoneNumber && content.contact?.phone) sections.push(`Phone: ${content.contact.phone}`);
  if (content.contact?.socials) {
    const { github, linkedin, twitter } = content.contact.socials;
    if (github) sections.push(`GitHub: ${github}`);
    if (linkedin) sections.push(`LinkedIn: ${linkedin}`);
    if (twitter) sections.push(`X: ${twitter}`);
  }
  sections.push("Direct Contact Page: /contact");

  // Owner-entered knowledge: current facts, then historical records (kept apart)
  if (!knowledge) {
    sections.push("\n[AUTHORITATIVE ORBIT KNOWLEDGE]");
    sections.push("The owner's knowledge entries could not be loaded right now; answer only from the sections above and say when something cannot be verified.");
  } else {
    const current = knowledge.filter((k) => k.status !== "historical");
    const currentIds = new Set<string>([
      ...(projects ?? []).flatMap((p) => [identityOf(p.title), identityOf(p.slug.replace(/-/g, " "))]),
      ...(posts ?? []).flatMap((p) => [identityOf(p.title), identityOf(p.slug.replace(/-/g, " "))]),
    ]);
    const historical = knowledge.filter((k) => {
      if (k.status !== "historical") return false;
      // a restored or recreated item is current again: its historical record no longer applies
      const ids = [identityOf(k.title), k.origin?.key ? identityOf(k.origin.key.replace(/-/g, " ")) : ""].filter(Boolean);
      return !ids.some((id) => currentIds.has(id));
    });

    if (current.length) {
      sections.push("\n[AUTHORITATIVE ORBIT KNOWLEDGE]");
      sections.push("Verified facts entered by Rushan Siddiqui in the admin CMS:");
      for (const item of current) {
        const cat = CATEGORY_LABELS[item.category] || item.category.toUpperCase();
        sections.push(`\n- [${cat}] ${item.title}${item.priority === "high" ? " [HIGH PRIORITY]" : ""}:`);
        sections.push(`  ${item.content.trim().split("\n").join("\n  ")}`);
      }
    }
    if (historical.length) {
      sections.push("\n[HISTORICAL RECORDS: NOT CURRENT]");
      sections.push("These describe the past only. Never present them as current, never count them as current projects or articles, and never add details they do not state.");
      for (const item of historical) {
        sections.push(`\n- ${item.title}:`);
        sections.push(`  ${item.content.trim().split("\n").join("\n  ")}`);
      }
    }
  }

  return sections.join("\n");
}

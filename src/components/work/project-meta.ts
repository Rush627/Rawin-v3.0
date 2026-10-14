import type { Project, ProjectStatus } from "@/lib/projects";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  completed: "Shipped",
  "in-progress": "In development",
  planned: "Planned",
};

export const STATUS_TONE: Record<ProjectStatus, string> = {
  completed: "text-success",
  "in-progress": "text-warning",
  planned: "text-accent",
};

/**
 * Build the visible category list: CMS taxonomy order first, then any values that
 * exist on projects but are not in the taxonomy (older data stays filterable).
 * Categories with no projects are omitted from the public rail.
 */
export function buildCategoryRail(projects: Pick<Project, "category">[], taxonomy: string[] = []) {
  const counts = new Map<string, number>();
  for (const p of projects) {
    const c = (p.category || "").trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const ordered: { name: string; count: number }[] = [];
  const seen = new Set<string>();
  for (const name of taxonomy) {
    const count = counts.get(name);
    if (count) {
      ordered.push({ name, count });
      seen.add(name);
    }
  }
  for (const [name, count] of counts) {
    if (!seen.has(name)) ordered.push({ name, count });
  }
  return ordered;
}

export function hasCaseStudy(p: Project) {
  return Boolean(p.caseStudyAvailable || p.problem || p.solution || p.outcome || p.role);
}

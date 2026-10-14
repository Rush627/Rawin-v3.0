import { getSiteContent } from "@/lib/site-content";
import { getProjects } from "@/lib/projects";
import { getPublishedPosts } from "@/lib/blog";
import { getActiveOrbitKnowledgeForAura } from "@/lib/orbit-knowledge";
import { compileAuraContext } from "./context";

/**
 * Orbit's knowledge context for one request, from the same cached reads the public pages use
 * (site content, projects, published articles, enabled knowledge entries). Each of those reads
 * is tag-cached and invalidated by the admin action that changes it, so a saved project,
 * article or knowledge entry reaches Orbit on the next message; there is no separate copy of
 * the context to go stale. A source that fails is reported as unavailable, never as empty, and
 * since nothing here is cached, the next message simply tries again.
 */
export async function getAuraKnowledgeContext(): Promise<string> {
  try {
    const [content, projects, posts, knowledge] = await Promise.all([
      getSiteContent(),
      getProjects().catch(() => null),
      getPublishedPosts().catch(() => null),
      getActiveOrbitKnowledgeForAura().catch(() => null),
    ]);
    return compileAuraContext({ content, projects, posts, knowledge });
  } catch (error) {
    console.error("[Orbit] Error compiling knowledge context:", error instanceof Error ? error.message : String(error));
    return "[SITE & CREATOR]\nRAWIN Founder & Developer: Rushan Siddiqui\nPlatform: RAWIN 3.0\nAI: RAWIN ORBIT\nRelationship: Rushan Siddiqui founded RAWIN and is Orbit's developer.\n\nThe site's project, article and knowledge records could not be loaded right now. Do not name or describe specific projects or articles; point visitors to /projects, /blog and /contact.";
  }
}

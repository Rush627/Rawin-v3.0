import PageIntro from "@/components/system/PageIntro";
import ProjectsExplorer from "@/components/work/ProjectsExplorer";
import { getProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/site-content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("projects", "/projects");
}

export const revalidate = 3600;

export default async function ProjectsPage() {
  const [projects, siteContent] = await Promise.all([getProjects(), getSiteContent()]);
  const shipped = projects.filter((p) => p.status === "completed").length;
  const years = projects.map((p) => Number.parseInt(p.year || "", 10)).filter((n) => Number.isFinite(n));
  const span = years.length ? `${Math.min(...years)} - ${Math.max(...years)}` : "-";

  return (
    <div className="flex flex-col">
      <PageIntro
        index="02"
        eyebrow="Selected work"
        title={[<span key="l0">Featured</span>, <em key="e" className="italic text-accent">projects</em>]}
        oneLineOnPhone="Featured projects"
        lede="Selected web applications, tools, and experiments I've built - each with the problem it answered and how it was made."
        meta={[
          { label: "Projects", value: String(projects.length).padStart(2, "0") },
          { label: "Shipped", value: String(shipped).padStart(2, "0") },
          { label: "Span", value: span },
        ]}
      />
      <section aria-label="Project index" className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
        <ProjectsExplorer projects={projects} categories={siteContent.taxonomy?.projectCategories} />
      </section>
    </div>
  );
}

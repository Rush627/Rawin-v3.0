import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import ProjectsTable from "@/components/admin/ProjectsTable";
import StudioHeader from "@/components/studio/StudioHeader";
import CategoriesCard from "@/components/studio/CategoriesCard";
import { getSiteContentFresh } from "@/lib/site-content";
import StatStrip from "@/components/admin/shell/StatStrip";

export const metadata = { title: "Projects | RAWIN Studio" };
export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/saint-denis/login?redirect=/saint-denis/projects");
  }

  const [projects, content] = await Promise.all([getProjects(), getSiteContentFresh()]);

  return (
    <div>
      <StudioHeader
        eyebrow="Projects"
        title="Selected work"
        description="Create, order and feature the work shown across the site."
        actions={
          <Link href="/saint-denis/projects/new" className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl bg-fg text-bg text-[14px] font-medium hover:opacity-90">
            <Plus aria-hidden="true" className="w-4 h-4" />
            New project
          </Link>
        }
      />
      <StatStrip
        stats={[
          { label: "Total", value: projects.length },
          { label: "Featured", value: projects.filter((p) => p.featured).length, tone: "accent" },
          { label: "Shipped", value: projects.filter((p) => p.status === "completed").length, tone: "success" },
          { label: "In development", value: projects.filter((p) => p.status === "in-progress").length, tone: "warning" },
        ]}
      />
      <ProjectsTable projects={projects} />
      <div className="mt-6">
        <CategoriesCard kind="projectCategories" initial={content.taxonomy.projectCategories} inUse={Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))} />
      </div>
    </div>
  );
}

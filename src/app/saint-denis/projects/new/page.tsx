import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import ProjectForm from "@/components/admin/ProjectForm";
import { createProjectAction } from "../actions";

export const metadata = {
  title: "New Project | RAWIN Admin",
};

export default async function NewProjectPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/saint-denis/login?redirect=/saint-denis/projects/new");
  }

  const content = await getSiteContent();
  return <ProjectForm action={createProjectAction} isEditing={false} categories={content.taxonomy?.projectCategories} />;
}

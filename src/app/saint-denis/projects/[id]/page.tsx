import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getProjectById } from "@/lib/projects";
import ProjectForm from "@/components/admin/ProjectForm";
import { updateProjectAction } from "../actions";

export const metadata = {
  title: "Edit Project | RAWIN Admin",
};

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const session = await getAdminSession();
  const { id } = await params;

  if (!session) {
    redirect(`/saint-denis/login?redirect=/saint-denis/projects/${id}`);
  }

  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }

  const boundUpdateAction = updateProjectAction.bind(null, id);

  return <ProjectForm initialData={project} action={boundUpdateAction} isEditing={true} />;
}

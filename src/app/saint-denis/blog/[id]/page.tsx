import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getPostById } from "@/lib/blog";
import PostForm from "@/components/admin/PostForm";
import { updatePostAction } from "../actions";

export const metadata = {
  title: "Edit Article | RAWIN Admin",
  description: "Update article content and publication parameters.",
};

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getAdminSession();
  const { id } = await params;

  if (!session) {
    redirect(`/saint-denis/login?redirect=/saint-denis/blog/${id}`);
  }

  const post = await getPostById(id);
  if (!post) {
    notFound();
  }

  const boundUpdateAction = updatePostAction.bind(null, id);

  return <PostForm initialData={post} action={boundUpdateAction} isEditing={true} />;
}

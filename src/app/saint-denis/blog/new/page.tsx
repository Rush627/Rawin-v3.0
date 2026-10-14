import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import PostForm from "@/components/admin/PostForm";
import { createPostAction } from "../actions";

export const metadata = {
  title: "Write Article | RAWIN Admin",
  description: "Compose a new technical article in Markdown.",
};

export default async function NewPostPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/saint-denis/login?redirect=/saint-denis/blog/new");
  }

  const content = await getSiteContent();
  return <PostForm action={createPostAction} isEditing={false} categories={content.taxonomy?.blogCategories} />;
}

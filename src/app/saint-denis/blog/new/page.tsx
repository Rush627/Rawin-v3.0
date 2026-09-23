import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
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

  return <PostForm action={createPostAction} isEditing={false} />;
}

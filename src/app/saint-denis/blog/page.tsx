import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/blog";
import BlogTable from "@/components/admin/BlogTable";
import StudioHeader from "@/components/studio/StudioHeader";
import CategoriesCard from "@/components/studio/CategoriesCard";
import { getSiteContentFresh } from "@/lib/site-content";
import StatStrip from "@/components/admin/shell/StatStrip";

export const metadata = { title: "Journal | RAWIN Studio" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/saint-denis/login?redirect=/saint-denis/blog");
  }

  const [posts, content] = await Promise.all([getAllPostsAdmin(), getSiteContentFresh()]);

  return (
    <div>
      <StudioHeader
        eyebrow="Journal"
        title="The Dev Log"
        description="Write in Markdown, set each article's publication date and choose the featured lead story."
        actions={
          <Link href="/saint-denis/blog/new" className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl bg-fg text-bg text-[14px] font-medium hover:opacity-90">
            <Plus aria-hidden="true" className="w-4 h-4" />
            New article
          </Link>
        }
      />
      <StatStrip
        stats={[
          { label: "Published", value: posts.filter((p) => p.status === "published").length, tone: "success" },
          { label: "Drafts", value: posts.filter((p) => p.status === "draft").length, tone: "warning" },
          { label: "Featured", value: posts.filter((p) => p.featured && p.status === "published").length, tone: "accent" },
          { label: "Archived", value: posts.filter((p) => p.status === "archived").length },
        ]}
      />
      <BlogTable posts={posts} />
      <div className="mt-6">
        <CategoriesCard kind="blogCategories" initial={content.taxonomy.blogCategories} inUse={Array.from(new Set(posts.map((p) => p.category).filter((c): c is string => Boolean(c))))} />
      </div>
    </div>
  );
}

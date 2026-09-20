import Link from "next/link";
import { redirect } from "next/navigation";
import { Sliders, ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import { getOrbitKnowledgeList } from "@/lib/orbit-knowledge";
import SiteContentEditor from "@/components/admin/SiteContentEditor";

export const metadata = {
  title: "Site Content CMS | RAWIN Admin",
  description: "Manage global copy, hero text, biographies, and call-to-action labels.",
};

export const revalidate = 0;

export default async function AdminContentPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?redirect=/admin/content");
  }

  const [content, knowledgeItems] = await Promise.all([
    getSiteContent(),
    getOrbitKnowledgeList(),
  ]);

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      {/* Smartphone Header (< sm) */}
      <div className="flex sm:hidden flex-col gap-2.5 pb-4 border-b border-white/[0.08]">
        {/* Dominant Page Heading & Subtitle */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-space">
            Site <span className="text-pacific-cyan">Content</span>
          </h1>
          <p className="text-xs text-muted font-mono">
            Manage the content behind each part of RAWIN.
          </p>
        </div>

        {/* Lower Controls Area */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer shrink-0"
            title="Return to Main Admin Dashboard"
            aria-label="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium glass-pill text-pacific-cyan border border-pacific-cyan/20 truncate">
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">CONTENT CMS ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Desktop Header (sm and up) */}
      <div className="hidden sm:flex sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
              <Sliders className="w-3.5 h-3.5" />
              <span>CONTENT CMS ACTIVE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
              Site <span className="text-pacific-cyan">Content</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted font-mono">
              Manage the content behind each part of RAWIN.
            </p>
          </div>
        </div>
      </div>

      {/* Editor Main */}
      <SiteContentEditor initialContent={content} initialKnowledge={knowledgeItems} />
    </div>
  );
}

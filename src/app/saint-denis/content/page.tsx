import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import StudioHeader from "@/components/studio/StudioHeader";
import { CONTENT_SECTIONS } from "./sections";

export const metadata = { title: "Site Content | RAWIN Studio" };
export const dynamic = "force-dynamic";

export default async function ContentIndexPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login?redirect=/saint-denis/content");

  return (
    <div>
      <StudioHeader eyebrow="Site Content" title="What visitors read" description="Each editor saves on its own. Availability and theme defaults are in Settings; images in Media & Identity." />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {CONTENT_SECTIONS.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/saint-denis/content/${s.slug}`}
              className="group flex items-center gap-4 min-h-[76px] px-4 sm:px-5 py-3.5 rounded-2xl border border-line bg-surface/70 hover:border-line-strong hover:bg-surface transition-colors"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-fg">{s.title}</span>
                <span className="block mt-0.5 text-[13px] text-fg-muted">{s.description}</span>
              </span>
              <ChevronRight aria-hidden="true" className="w-4 h-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

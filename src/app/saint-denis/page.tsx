import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FilePlus2, FolderPlus } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { getAllPostsAdmin } from "@/lib/blog";
import { getSiteContentFresh, maintenanceActiveNow } from "@/lib/site-content";
import { getSystemChecks } from "@/lib/studio/system-checks";
import { AVAILABILITY_STATE_LABEL } from "@/lib/cms/availability";
import StudioHeader from "@/components/studio/StudioHeader";
import { StatusLine } from "@/components/studio/fields";

export const metadata = { title: "Overview | RAWIN Studio" };
export const dynamic = "force-dynamic";

const when = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

/**
 * Only facts that were actually read: a database ping, counts from the collections, stored
 * timestamps. When a read fails the tile says so instead of showing a number.
 */
export default async function OverviewPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login");

  const [system, content, projects, posts] = await Promise.all([
    getSystemChecks(),
    getSiteContentFresh().catch(() => null),
    getProjects().catch(() => null),
    getAllPostsAdmin().catch(() => null),
  ]);

  const published = posts?.filter((p) => p.status === "published").length ?? null;
  const drafts = posts?.filter((p) => p.status === "draft").length ?? null;
  const modeActive = content ? maintenanceActiveNow(content.maintenance) : false;
  const mode = !content ? null : !modeActive ? "Live" : content.maintenance.showMessage ? "Maintenance" : "Offline";
  const aiConfigured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);

  const recent = [
    ...(projects ?? []).map((p) => ({ kind: "Project", title: p.title, at: p.updatedAt, href: p._id ? `/saint-denis/projects/${p._id}` : "/saint-denis/projects" })),
    ...(posts ?? []).map((p) => ({ kind: p.status === "published" ? "Article" : "Draft", title: p.title, at: p.updatedAt, href: p._id ? `/saint-denis/blog/${p._id}` : "/saint-denis/blog" })),
  ]
    .filter((r) => !Number.isNaN(Date.parse(r.at || "")))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 6);

  const tiles: { label: string; value: string; detail: string; href: string }[] = [
    {
      label: "Projects",
      value: projects ? String(projects.length) : "—",
      detail: projects ? `${projects.filter((p) => p.featured).length} featured · ${projects.filter((p) => p.status === "completed").length} completed` : "Could not be read",
      href: "/saint-denis/projects",
    },
    {
      label: "Journal",
      value: published !== null ? String(published) : "—",
      detail: posts ? `published · ${drafts} draft${drafts === 1 ? "" : "s"}` : "Could not be read",
      href: "/saint-denis/blog",
    },
    {
      label: "Site",
      value: mode ?? "—",
      detail: content ? `${AVAILABILITY_STATE_LABEL[content.availability.state]} · “${content.availability.label}”` : "Could not be read",
      href: "/saint-denis/settings",
    },
  ];

  return (
    <div>
      <StudioHeader
        eyebrow="RAWIN Studio"
        title="Overview"
        actions={
          <>
            <Link href="/saint-denis/projects/new" className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl border border-line-strong text-[14px] text-fg hover:border-fg-subtle">
              <FolderPlus aria-hidden="true" className="w-4 h-4" />
              New project
            </Link>
            <Link href="/saint-denis/blog/new" className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl bg-fg text-bg text-[14px] font-medium hover:opacity-90">
              <FilePlus2 aria-hidden="true" className="w-4 h-4" />
              New article
            </Link>
          </>
        }
      />

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block h-full rounded-2xl border border-line bg-surface/70 p-4 sm:p-5 hover:border-line-strong transition-colors">
              <p className="label-mono text-fg-subtle">{t.label}</p>
              <p className="mt-2 font-display text-[2.4rem] leading-none text-fg">{t.value}</p>
              <p className="mt-2 text-[13px] text-fg-muted">{t.detail}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-3">
        <section aria-labelledby="recent-h" className="lg:col-span-3 rounded-2xl border border-line bg-surface/70 p-4 sm:p-5">
          <h2 id="recent-h" className="text-[15px] font-semibold">
            Recently edited
          </h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-[14px] text-fg-muted">{projects && posts ? "Nothing yet." : "Could not be read."}</p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y divide-line">
              {recent.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="flex items-center justify-between gap-3 min-h-12 py-2 text-[14px] hover:text-fg">
                    <span className="min-w-0">
                      <span className="label-mono text-fg-subtle mr-2">{r.kind}</span>
                      <span className="text-fg">{r.title}</span>
                    </span>
                    <span className="shrink-0 text-[12.5px] text-fg-subtle">{when(r.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {content?.updatedAt && <p className="mt-3 pt-3 border-t border-line text-[12.5px] text-fg-subtle">Site content last saved {when(content.updatedAt)}</p>}
        </section>

        <section aria-labelledby="health-h" className="lg:col-span-2 rounded-2xl border border-line bg-surface/70 p-4 sm:p-5">
          <h2 id="health-h" className="text-[15px] font-semibold">
            Health
          </h2>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {system.checks.slice(0, 2).map((c) => (
              <li key={c.label} className="flex flex-col gap-0.5 py-2.5">
                <span className="text-[13.5px] text-fg">{c.label}</span>
                <StatusLine tone={c.tone}>{c.detail}</StatusLine>
              </li>
            ))}
            <li className="flex flex-col gap-0.5 py-2.5">
              <span className="text-[13.5px] text-fg">Workers AI</span>
              <StatusLine tone={aiConfigured ? "ok" : "warn"}>{aiConfigured ? "Configured (not called)" : "Credentials missing"}</StatusLine>
            </li>
          </ul>
          <a href="/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 min-h-11 text-[13.5px] text-fg-muted hover:text-fg">
            Open the live site
            <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5" />
          </a>
        </section>
      </div>
    </div>
  );
}

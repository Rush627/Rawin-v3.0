import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContentFresh } from "@/lib/site-content";
import { isUploadedAsset } from "@/lib/brand-assets";
import { getAssetInventory } from "@/lib/studio/asset-inventory";
import StudioHeader from "@/components/studio/StudioHeader";
import AssetCard, { type IdentitySlot } from "@/components/studio/AssetCard";
import ResumePdfCard from "@/components/studio/ResumePdfCard";

export const metadata = { title: "Media & Identity | RAWIN Studio" };
export const dynamic = "force-dynamic";

const SLOTS: IdentitySlot[] = ["profilePhoto", "logoLight", "logoDark", "faviconLight", "faviconDark"];
const size = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function MediaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login?redirect=/saint-denis/media");

  const [content, inventory] = await Promise.all([getSiteContentFresh(), getAssetInventory().catch(() => null)]);
  const pdf = content.resume.pdf;

  return (
    <div className="flex flex-col gap-10">
      <StudioHeader eyebrow="Media & Identity" title="Images and files" description="Each slot shows what the site uses now. Replacing a file keeps the old one until the new one is stored." />

      <section aria-labelledby="identity-h" className="flex flex-col gap-3">
        <h2 id="identity-h" className="text-[13px] font-medium text-fg-muted uppercase tracking-wide">
          Identity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SLOTS.map((slot) => {
            const a = content.assets[slot];
            return <AssetCard key={slot} slot={slot} url={a.url} alt={a.alt || ""} uploaded={isUploadedAsset(a.url)} />;
          })}
        </div>
      </section>

      <section aria-labelledby="evolution-h" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="evolution-h" className="text-[13px] font-medium text-fg-muted uppercase tracking-wide">
            About · evolution screenshots
          </h2>
          <Link href="/saint-denis/content/about" className="inline-flex items-center min-h-11 text-[13.5px] text-fg-muted hover:text-fg">
            Edit in About →
          </Link>
        </div>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {content.about.evolution.map((m) => (
            <li key={m.id} className="rounded-xl border border-line bg-surface/70 overflow-hidden">
              <div className="aspect-[16/10] bg-surface-2">
                {m.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.preview} alt={m.previewAlt || ""} className="w-full h-full object-contain" />
                ) : null}
              </div>
              <p className="px-3 py-2 text-[13px] text-fg truncate">
                {m.year} · {m.title}
                <span className="block text-[12px] text-fg-subtle">{isUploadedAsset(m.preview) ? "Custom upload active" : m.preview ? "Built-in active" : "No screenshot"}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="docs-h" className="flex flex-col gap-3">
        <h2 id="docs-h" className="text-[13px] font-medium text-fg-muted uppercase tracking-wide">
          Documents
        </h2>
        <ResumePdfCard pdf={pdf ? { filename: pdf.filename, url: pdf.url, size: pdf.size, updatedAt: pdf.updatedAt } : null} />
      </section>

      <section aria-labelledby="storage-h" className="flex flex-col gap-3">
        <h2 id="storage-h" className="text-[13px] font-medium text-fg-muted uppercase tracking-wide">
          Storage
        </h2>
        <div className="rounded-2xl border border-line bg-surface/70 p-4 sm:p-5">
          {!inventory ? (
            <p className="text-[14px] text-fg-muted">The asset store could not be read right now.</p>
          ) : (
            <>
              <p className="text-[14px] text-fg">
                {inventory.total} stored file{inventory.total === 1 ? "" : "s"} · {size(inventory.totalBytes)}
              </p>
              {inventory.orphans.length === 0 ? (
                <p className="mt-1 text-[13px] text-fg-muted">Every stored file is in use.</p>
              ) : (
                <>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    {inventory.orphans.length} file{inventory.orphans.length === 1 ? " is" : "s are"} not referenced by any page, project or article (
                    {size(inventory.orphans.reduce((n, f) => n + f.bytes, 0))}). They are listed for review only; nothing is deleted from here.
                  </p>
                  <ul className="mt-3 flex flex-col divide-y divide-line">
                    {inventory.orphans.map((f) => (
                      <li key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 text-[13px]">
                        <span className="text-fg truncate">{f.name}</span>
                        <span className="text-fg-subtle font-mono text-[12px]">
                          {f.kind} · {size(f.bytes)}
                          {f.uploadedAt ? ` · ${f.uploadedAt.slice(0, 10)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { FilterSegment } from "./filters";

type Device = "desktop" | "phone";

interface Frame {
  /** CSS aspect-ratio of the public image box */
  aspect: string;
  /** corner radius on the public page, in CSS px */
  radius: number;
  /** typical rendered width of that box on the public page, in CSS px (scales the radius) */
  width: number;
  /** share of a 390px phone screen the box spans (phone frames only) */
  span?: number;
}

interface Context {
  id: string;
  label: string;
  where: string;
  desktop: Frame;
  phone: Frame;
}

/*
 * Mirrors the public components exactly; keep in step with them:
 * projects  → ProjectVisual: object-contain, centred on the theme surface (projects/[slug]/page.tsx plate,
 *             ProjectsExplorer Exhibit rows on desktop, ProjectArchive dial cards on phones)
 * articles  → ArticleCover: object-cover, centred (.article-cover in globals.css, blog/page.tsx cards)
 */
const CONTEXTS: Record<"project" | "article", Context[]> = {
  project: [
    {
      id: "case",
      label: "Case study",
      where: "Top of the project's own page",
      desktop: { aspect: "16 / 9", radius: 36, width: 1360 },
      phone: { aspect: "4 / 3", radius: 24, width: 358, span: 358 / 390 },
    },
    {
      id: "list",
      label: "Projects page",
      where: "The project's entry on /projects",
      desktop: { aspect: "16 / 10", radius: 32, width: 760 },
      phone: { aspect: "16 / 9", radius: 11, width: 300, span: 0.77 },
    },
  ],
  article: [
    {
      id: "article",
      label: "Article cover",
      where: "Under the article's title",
      desktop: { aspect: "21 / 9", radius: 28, width: 1080 },
      phone: { aspect: "16 / 10", radius: 20, width: 358, span: 358 / 390 },
    },
    {
      id: "card",
      label: "Journal card",
      where: "The article's card on /blog",
      desktop: { aspect: "16 / 10", radius: 22, width: 600 },
      phone: { aspect: "16 / 10", radius: 18, width: 358, span: 358 / 390 },
    },
  ],
};

function ratioText(aspect: string) {
  return aspect.replace(/\s/g, "").replace("/", ":");
}

/**
 * Shows an uploaded image the way the public site will present it: the same box proportions,
 * crop alignment, corner radius (scaled to the preview) and project tone wash, at desktop or
 * smartphone size. Switching views never touches the stored image.
 */
export default function PublicImagePreview({
  src,
  kind,
  children,
}: {
  src: string;
  kind: "project" | "article";
  /** accepted for compatibility; project screenshots no longer carry a tone wash */
  project?: { tone?: string | null; slug?: string; title?: string };
  /** overlay content (e.g. an upload in progress) drawn over the image */
  children?: ReactNode;
}) {
  const contexts = CONTEXTS[kind];
  const [device, setDevice] = useState<Device>("desktop");
  const [ctxId, setCtxId] = useState(contexts[0].id);
  // remembered per source, so a replacement image gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ src: string; w: number; h: number } | null>(null);
  const failed = failedSrc === src;

  const ctx = contexts.find((c) => c.id === ctxId) ?? contexts[0];
  const frame = ctx[device];
  // projects are fitted whole (contain); article covers fill and crop from the centre (cover)
  const fit = kind === "project" ? "object-contain" : "object-cover";

  const image = (
    <div
      className={`relative overflow-hidden border border-line ${kind === "project" ? "bg-surface" : "bg-sunken"}`}
      style={{ aspectRatio: frame.aspect, borderRadius: `${(frame.radius / frame.width) * 100}cqw` }}
    >
      {failed ? (
        <div role="img" aria-label="Image could not be loaded" className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-fg-muted">
          <ImageOff aria-hidden="true" className="w-5 h-5" />
          <span className="text-[12.5px]">This image could not be loaded. Try replacing it.</span>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onError={() => setFailedSrc(src)}
            onLoad={(e) => setNatural({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className={`absolute inset-0 w-full h-full object-center ${fit}`}
          />
        </>
      )}
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterSegment
          label="Where it appears"
          value={ctxId}
          onChange={setCtxId}
          options={contexts.map((c) => ({ value: c.id, label: c.label }))}
        />
        <FilterSegment
          label="Preview size"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "phone", label: "Smartphone" },
          ]}
        />
      </div>

      {device === "desktop" ? (
        <div className="[container-type:inline-size]">{image}</div>
      ) : (
        // a 390px-wide phone screen drawn at 300px: the image takes the same share of its width
        <div className="mx-auto w-full max-w-[300px]">
          <div className="rounded-2xl border border-dashed border-line-strong bg-bg py-5 flex justify-center">
            <div style={{ width: `${(frame.span ?? 1) * 100}%` }}>
              {/* the corner radius scales with the card's own width */}
              <div className="[container-type:inline-size]">{image}</div>
            </div>
          </div>
          <p className="mt-1.5 text-center label-mono text-fg-subtle text-[10px]">Phone screen, 390 px wide</p>
        </div>
      )}

      <p className="text-[12.5px] text-fg-subtle">
        {ctx.where} · {device === "desktop" ? "desktop" : "smartphone"} · {ratioText(frame.aspect)} frame,{" "}
        {kind === "project" ? "whole image fitted and centred" : "filled and cropped from the centre"}
        {natural?.src === src ? ` · image ${natural.w} × ${natural.h} px` : ""}
      </p>
    </div>
  );
}

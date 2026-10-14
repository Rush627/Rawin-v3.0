import Image from "next/image";
import type { Project } from "@/lib/projects";
import { resolveTone, TONE_SWATCH } from "@/lib/project-tone";

interface ProjectVisualProps {
  project: Pick<Project, "title" | "shortName" | "slug" | "previewImage" | "category" | "year"> & { tone?: string };
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Render the screenshot in monochrome until hover (editorial index treatment) */
  monochrome?: boolean;
}

/**
 * The project's visual: its real screenshot when one exists, otherwise a designed
 * tonal plate carrying the project's name. Never invents interface imagery.
 */
export default function ProjectVisual({ project, className = "", sizes = "100vw", priority, monochrome }: ProjectVisualProps) {
  const tone = resolveTone(project);
  const sw = TONE_SWATCH[tone];

  // "/images/profile.png" was the legacy placeholder value — never present it as a screenshot
  // The screenshot is shown whole: fitted inside the frame (never cropped, stretched or zoomed),
  // centred, with the theme's surface filling any space its proportions leave over.
  if (project.previewImage && project.previewImage !== "/images/profile.png") {
    return (
      <div data-field-surface="image" className={`relative overflow-hidden bg-surface ${className}`}>
        <Image
          src={project.previewImage}
          alt={`${project.title} - interface preview`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className={`object-contain object-center transition-[filter] duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
            monochrome ? "grayscale group-hover:grayscale-0" : ""
          }`}
        />
      </div>
    );
  }

  const name = project.shortName || project.title;
  return (
    <div
      data-field-surface="image"
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 85% 10%, ${sw.c}, transparent 55%), radial-gradient(90% 80% at 10% 100%, ${sw.b}, transparent 60%), ${sw.a}`,
        color: sw.ink,
      }}
      role="img"
      aria-label={`${project.title} - preview coming soon`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div aria-hidden="true" className="absolute inset-[8%] border border-current/20 rounded-[inherit]" />
      <div className="absolute inset-0 flex flex-col justify-between p-[7%]">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-70">
          {project.category}
          {project.year ? ` - ${project.year}` : ""}
        </span>
        <span className="font-display italic leading-[0.9] tracking-[-0.02em] text-[clamp(2rem,6vw,5.5rem)] break-words">
          {name}
        </span>
      </div>
    </div>
  );
}

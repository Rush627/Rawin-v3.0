export interface EvolutionMilestone {
  year: string;
  label: string;
  progression: string;
  title: string;
  domain: string;
  description: string;
  technologies: string[];
  url?: string;
  status: "archived" | "current";
  preview: string;
  ctaText: string;
}

export const EVOLUTION_MILESTONES: EvolutionMilestone[] = [
  {
    year: "2022",
    label: "FIRST BUILD",
    progression: "I learned to build.",
    title: "The First Build",
    domain: "Rushansidd.in",
    description:
      "My first personal website, built from the ground up with HTML and CSS. It was where I began experimenting with layouts, typography and creating a personal identity on the web.",
    technologies: ["HTML", "CSS"],
    url: "https://rush627.github.io/Rushansidd.in",
    status: "archived",
    preview: "/images/evolution-2022.png",
    ctaText: "VIEW WEBSITE",
  },
  {
    year: "2023",
    label: "RAWIN V2.0",
    progression: "I learned to refine.",
    title: "RAWIN V2.0",
    domain: "Rushan.in",
    description:
      "A significant step forward in both design and implementation. RAWIN V2.0 introduced a more refined visual system, improved responsiveness and richer interaction while remaining a handcrafted static website.",
    technologies: ["HTML", "CSS", "JavaScript"],
    url: "https://rush627.github.io/Rushan.in",
    status: "archived",
    preview: "/images/evolution-2023.png",
    ctaText: "VIEW WEBSITE",
  },
  {
    year: "2026",
    label: "RAWIN 3.0",
    progression: "I am building systems.",
    title: "RAWIN 3.0",
    domain: "rawin.dev",
    description:
      "The transition from a static portfolio into a modern engineering platform. RAWIN 3.0 is built with reusable components, modern application architecture, intentional interaction and a stronger focus on building complete digital experiences.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    status: "current",
    preview: "/images/evolution-2026.png",
    ctaText: "YOU ARE HERE",
  },
];

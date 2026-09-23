import type { Metadata } from "next";
import { getSiteContent } from "@/lib/site-content";
import ResumeDesktopView from "@/components/ResumeDesktopView";
import ResumeMobileView from "@/components/ResumeMobileView";

export const metadata: Metadata = {
  title: "Resume & Curriculum Vitae | Rushan Siddiqui",
  description: "Professional resume and developer profile of Rushan Siddiqui: Full Stack Developer.",
};

export const revalidate = 3600;

export default async function ResumePage() {
  const content = await getSiteContent();
  const resume = content.resume;
  const global = content.global;

  const cleanSummary =
    resume.summary && !resume.summary.includes("over 4 years")
      ? resume.summary
      : "Full stack developer focused on building fast, reliable web applications with Next.js, TypeScript, and modern backend systems. Passionate about interface craft, performance, and writing clean, maintainable code.";

  const skillsList = [...(resume.skills || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  const experienceList = [...(resume.experience || [])]
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((item) => ({
      ...item,
      role: item.role
        .replace(/\bEngineer\b/g, "Developer")
        .replace(/\bEngineering\b/g, "Developer"),
    }));

  const cleanResume = {
    ...resume,
    experience: experienceList,
  };

  const educationList = [...(resume.education || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  const contactLocation =
    content.contact?.location ||
    resume.contact?.location ||
    global.location ||
    "Jaunpur, Uttar Pradesh, India";

  const contactEmail =
    content.contact?.email ||
    resume.contact?.email ||
    global.contactEmail ||
    "rushansiddiqui5262@gmail.com";

  const contactWebsite = resume.contact?.website || "https://rawin.dev";

  const statusIndicator = resume.status?.indicator || "green";
  const statusTextColorClass =
    statusIndicator === "orange"
      ? "text-amber-400"
      : statusIndicator === "cyan"
      ? "text-pacific-cyan"
      : statusIndicator === "gray"
      ? "text-zinc-400"
      : "text-emerald-400";

  const statusDotClass =
    statusIndicator === "orange"
      ? "bg-amber-400"
      : statusIndicator === "cyan"
      ? "bg-pacific-cyan"
      : statusIndicator === "gray"
      ? "bg-zinc-400"
      : "bg-emerald-400";

  return (
    <div className="relative w-full min-h-screen min-h-dvh">
      {/* Top ambient backdrop prevents content from colliding behind floating navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 h-32 bg-gradient-to-b from-ink-black via-ink-black/90 to-transparent z-30"
      />

      {/* Desktop Presentation Layer */}
      <div className="hidden lg:block">
        <ResumeDesktopView
          resume={cleanResume}
          global={global}
          contactLocation={contactLocation}
          contactEmail={contactEmail}
          contactWebsite={contactWebsite}
          statusTextColorClass={statusTextColorClass}
          statusDotClass={statusDotClass}
          skillsList={skillsList}
          experienceList={experienceList}
          educationList={educationList}
          cleanSummary={cleanSummary}
        />
      </div>

      {/* Smartphone and Tablet Presentation Layer */}
      <div className="block lg:hidden">
        <ResumeMobileView
          resume={cleanResume}
          global={global}
          contactLocation={contactLocation}
          contactEmail={contactEmail}
          contactWebsite={contactWebsite}
          statusTextColorClass={statusTextColorClass}
          statusDotClass={statusDotClass}
          skillsList={skillsList}
          experienceList={experienceList}
          educationList={educationList}
          cleanSummary={cleanSummary}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContentFresh } from "@/lib/site-content";
import { getOrbitKnowledgeList } from "@/lib/orbit-knowledge";
import { getDatabase } from "@/lib/mongodb";
import StudioHeader from "@/components/studio/StudioHeader";
import { Group, StatusLine } from "@/components/studio/fields";
import VerificationCodeCard from "@/components/studio/VerificationCodeCard";
import OrbitKnowledgeManager from "@/components/admin/OrbitKnowledgeManager";

export const metadata = { title: "Orbit Intelligence | RAWIN Studio" };
export const dynamic = "force-dynamic";

async function sourceCounts() {
  const db = await getDatabase();
  if (!db) return null;
  try {
    const [projects, articles, code] = await Promise.all([
      db.collection("projects").countDocuments(),
      db.collection("blogPosts").countDocuments({ status: "published" }),
      db.collection("orbit_security").countDocuments({ key: "owner_verification" }, { limit: 1 }),
    ]);
    return { projects, articles, codeSet: code > 0 };
  } catch {
    return null;
  }
}

export default async function OrbitPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login?redirect=/saint-denis/orbit");

  const [content, knowledge, counts] = await Promise.all([getSiteContentFresh(), getOrbitKnowledgeList(), sourceCounts()]);
  const ai = content.ai;
  const configured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  const enabledEntries = knowledge.filter((k) => k.enabled).length;

  const caps: [string, boolean, string][] = [
    ["Voice input", ai.voiceInput !== false, "browser dictation"],
    ["Spoken replies", ai.voicePlayback !== false, ai.cloudVoice !== false ? "Workers AI MeloTTS" : "device voices"],
    ["Server transcription", ai.serverTranscription === true, "Workers AI Whisper"],
    ["File & photo attachments", ai.fileAttachments === true, "Workers AI conversion, deleted after 60 minutes"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <StudioHeader eyebrow="Orbit Intelligence" title="What Orbit knows" description="Facts you add here take priority over everything Orbit reads from the site." />

      <Group title="Sources Orbit reads" description="Compiled for each question (kept for up to a minute).">
        <ul className="flex flex-col divide-y divide-line text-[14px]">
          <li className="flex justify-between gap-3 py-2.5">
            <span>Site content: bio, about, resume, contact, availability</span>
            <Link href="/saint-denis/content" className="shrink-0 text-fg-muted hover:text-fg">
              Site Content
            </Link>
          </li>
          <li className="flex justify-between gap-3 py-2.5">
            <span>Projects</span>
            <span className="text-fg-muted">{counts ? `${counts.projects} published` : "Not checked"}</span>
          </li>
          <li className="flex justify-between gap-3 py-2.5">
            <span>Journal articles</span>
            <span className="text-fg-muted">{counts ? `${counts.articles} published` : "Not checked"}</span>
          </li>
          <li className="flex justify-between gap-3 py-2.5">
            <span>Knowledge entries</span>
            <span className="text-fg-muted">
              {enabledEntries} of {knowledge.length} enabled
            </span>
          </li>
        </ul>
      </Group>

      <OrbitKnowledgeManager initialItems={knowledge} />

      <VerificationCodeCard isSet={Boolean(counts?.codeSet)} />

      <Group title="Capabilities" description="Switched on and off in Site Content, RAWIN Orbit." defaultOpen={false}>
        <ul className="flex flex-col divide-y divide-line">
          <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5">
            <span className="text-[14px]">Workers AI</span>
            <StatusLine tone={configured ? "ok" : "error"}>{configured ? "Credentials configured (not called from here)" : "Credentials missing"}</StatusLine>
          </li>
          {caps.map(([label, on, detail]) => (
            <li key={label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5">
              <span className="text-[14px]">{label}</span>
              <StatusLine tone={on ? "ok" : "muted"}>{on ? `On · ${detail}` : "Off"}</StatusLine>
            </li>
          ))}
        </ul>
        <Link href="/saint-denis/content/orbit" className="self-start inline-flex items-center min-h-11 text-[13.5px] text-fg-muted hover:text-fg">
          Change in Site Content
        </Link>
      </Group>
    </div>
  );
}

import { getSiteContent, publicSiteClosed } from "@/lib/site-content";
import AIAssistantView from "@/components/AIAssistantView";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("ai", "/ai");
}

export default async function AIAssistantPage() {
  // maintenance, offline or unreadable content: the layout shows the maintenance screen
  if (await publicSiteClosed()) return null;

  const content = await getSiteContent();

  return <AIAssistantView content={content.ai} />;
}

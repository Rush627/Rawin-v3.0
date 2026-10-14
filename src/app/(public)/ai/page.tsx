import { getSiteContent } from "@/lib/site-content";
import AIAssistantView from "@/components/AIAssistantView";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("ai", "/ai");
}

export default async function AIAssistantPage() {
  const content = await getSiteContent();

  return <AIAssistantView content={content.ai} />;
}

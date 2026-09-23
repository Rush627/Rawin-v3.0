import type { Metadata } from "next";
import { getSiteContent } from "@/lib/site-content";
import AIAssistantView from "@/components/AIAssistantView";

export const metadata: Metadata = {
  title: "RAWIN ORBIT | AI Intelligence Interface",
  description:
    "RAWIN ORBIT is the AI system built by Rushan Siddiqui for exploring projects, engineering background, writing, and platform architecture.",
};

export default async function AIAssistantPage() {
  const content = await getSiteContent();

  return <AIAssistantView content={content.ai} />;
}

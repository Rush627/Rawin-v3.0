import { queryAura } from "./aura/provider";
import type { AuraMessage } from "./aura/types";

export type { AuraMessage as ChatMessage };

/**
 * Legacy interface for backward compatibility.
 * Delegates to Rawin Orbit service.
 */
export async function queryAIAssistant(prompt: string): Promise<string> {
  const result = await queryAura([{ role: "user", content: prompt }], false);
  if ("content" in result) {
    return result.content;
  }
  return "Unable to process request.";
}

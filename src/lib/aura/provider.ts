import { getAuraConfig } from "./config";
import { getAuraKnowledgeContext } from "./knowledge";
import { buildAuraSystemPrompt } from "./prompts";
import type { AuraMessage } from "./types";
import type { OrbitIdentityState } from "../orbit-security";

export interface StreamAuraResult {
  stream: ReadableStream<Uint8Array>;
}

export interface NonStreamAuraResult {
  content: string;
  model: string;
}

/**
 * Transforms Cloudflare Workers AI SSE response stream into a client-safe SSE stream.
 */
function createCloudflareStreamTransformer(): TransformStream<Uint8Array, Uint8Array> {
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      buffer += textDecoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      // Keep last incomplete segment in buffer
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith("data:")) continue;

        const dataStr = line.slice(5).trim();
        if (dataStr === "[DONE]") {
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify({ text: "", done: true })}\n\n`)
          );
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const responseText = parsed.response || "";
          if (responseText) {
            controller.enqueue(
              textEncoder.encode(
                `data: ${JSON.stringify({ text: responseText, done: false })}\n\n`
              )
            );
          }
        } catch {
          // Non-JSON or malformed chunk, safely ignore
        }
      }
    },
    flush(controller) {
      if (buffer.trim().length > 0) {
        const line = buffer.trim();
        if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") {
            controller.enqueue(
              textEncoder.encode(`data: ${JSON.stringify({ text: "", done: true })}\n\n`)
            );
          } else {
            try {
              const parsed = JSON.parse(dataStr);
              const responseText = parsed.response || "";
              if (responseText) {
                controller.enqueue(
                  textEncoder.encode(
                    `data: ${JSON.stringify({ text: responseText, done: false })}\n\n`
                  )
                );
              }
            } catch {
              // Ignore
            }
          }
        }
      }
      controller.enqueue(
        textEncoder.encode(`data: ${JSON.stringify({ text: "", done: true })}\n\n`)
      );
    },
  });
}

/**
 * Executes a conversation turn with Cloudflare Workers AI.
 */
export async function queryAura(
  clientMessages: AuraMessage[],
  stream = true,
  identityState: OrbitIdentityState = "UNKNOWN"
): Promise<StreamAuraResult | NonStreamAuraResult> {
  const config = getAuraConfig();

  if (!config.isConfigured) {
    throw new Error(
      "AURA_CONFIG_MISSING: Cloudflare Workers AI credentials (CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN) are not configured."
    );
  }

  const knowledgeContext = await getAuraKnowledgeContext();
  const systemPrompt = buildAuraSystemPrompt(knowledgeContext, identityState);

  const payloadMessages = [
    { role: "system", content: systemPrompt },
    ...clientMessages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, config.maxMessageLength),
    })),
  ];

  const url =
    config.endpoint ||
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${config.model}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiToken) {
      headers["Authorization"] = `Bearer ${config.apiToken}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: payloadMessages,
        stream,
        max_tokens: config.maxOutputTokens || 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errDetail = "";
      try {
        const errJson = await res.json();
        errDetail = JSON.stringify(errJson);
      } catch {
        errDetail = await res.text().catch(() => "");
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(`AURA_AUTH_ERROR: Cloudflare Workers AI authentication failed.`);
      }
      if (res.status === 429) {
        throw new Error(`AURA_RATE_LIMIT: Cloudflare Workers AI rate limit exceeded.`);
      }
      throw new Error(`AURA_PROVIDER_ERROR: Status ${res.status} - ${errDetail.slice(0, 200)}`);
    }

    if (stream && res.body) {
      const transformedStream = res.body.pipeThrough(createCloudflareStreamTransformer());
      return { stream: transformedStream };
    }

    // Non-streaming fallback
    const data = await res.json();
    const replyText =
      data?.result?.response ||
      data?.response ||
      "I processed your request, but received an empty response.";

    return {
      content: replyText,
      model: config.model,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AURA_TIMEOUT: Model inference request timed out.");
    }
    throw err;
  }
}

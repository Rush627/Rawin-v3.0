export interface AuraRuntimeConfig {
  accountId: string;
  apiToken: string;
  model: string;
  endpoint?: string;
  isConfigured: boolean;
  maxTurns: number;
  maxMessageLength: number;
  maxTotalChars: number;
  requestTimeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxOutputTokens: number;
}

export function getAuraConfig(): AuraRuntimeConfig {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
  const endpoint = (process.env.CLOUDFLARE_AI_ENDPOINT || "").trim() || undefined;
  const model =
    (process.env.CLOUDFLARE_AI_MODEL || "").trim() || "@cf/meta/llama-3.2-3b-instruct";

  const isConfigured = Boolean((accountId && apiToken) || endpoint);

  return {
    accountId,
    apiToken,
    model,
    endpoint,
    isConfigured,
    maxTurns: 10,
    maxMessageLength: 4000,
    maxTotalChars: 16000,
    requestTimeoutMs: 30000,
    rateLimitWindowMs: 60 * 1000,
    rateLimitMaxRequests: 20,
    maxOutputTokens: 1024,
  };
}

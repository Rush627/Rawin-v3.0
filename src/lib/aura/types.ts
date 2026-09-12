export type AuraRole = "user" | "assistant" | "system";

export interface AuraMessage {
  id?: string;
  role: AuraRole;
  content: string;
  timestamp?: string;
}

export interface AuraChatRequest {
  messages: AuraMessage[];
  stream?: boolean;
}

export interface AuraStreamChunk {
  text: string;
  done: boolean;
  error?: string;
}

export interface AuraProviderConfig {
  accountId: string;
  apiToken: string;
  model: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AuraChatResponse {
  content: string;
  role: "assistant";
  model: string;
  timestamp: string;
}

// Orbit aliases
export type OrbitMessage = AuraMessage;
export type OrbitChatRequest = AuraChatRequest;
export type OrbitStreamChunk = AuraStreamChunk;
export type OrbitChatResponse = AuraChatResponse;

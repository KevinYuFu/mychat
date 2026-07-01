export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Override the provider's default model for this request. */
  model?: string;
  /** Optional system prompt (sets persona: roleplay, assistant, etc.). */
  system?: string;
}

export interface ModelInfo {
  id: string;
  provider: string;
}

/**
 * A chat backend. The rest of the app depends only on this interface, never
 * on a specific vendor — swap the implementation to swap the LLM.
 */
export interface LLM {
  streamChat(req: ChatRequest, signal?: AbortSignal): AsyncIterable<string>;
  listModels(): ModelInfo[];
}

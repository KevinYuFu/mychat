import { z } from "zod";

/** A single OpenAI-compatible endpoint we can talk to. */
export interface ProviderConfig {
  id: string;
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
  headers?: Record<string, string>;
}

export interface AppConfig {
  port: number;
  defaultProviderId: string;
  providers: ProviderConfig[];
  defaultSystemPrompt?: string;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  MODEL: z.string().default("cognitivecomputations/dolphin-mistral-24b-venice-edition"),
  SYSTEM_PROMPT: z.string().optional(),
});

/**
 * Build the app config from the environment. Fails fast on malformed values
 * (bad URL, non-numeric port); a missing API key is allowed so the server can
 * still boot — the chat route reports that clearly at request time.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);

  const openrouter: ProviderConfig = {
    id: "openrouter",
    baseURL: parsed.OPENROUTER_BASE_URL,
    apiKey: parsed.OPENROUTER_API_KEY,
    models: [parsed.MODEL],
    defaultModel: parsed.MODEL,
    headers: { "X-Title": "freechat" },
  };

  return {
    port: parsed.PORT,
    defaultProviderId: openrouter.id,
    providers: [openrouter],
    defaultSystemPrompt: parsed.SYSTEM_PROMPT,
  };
}

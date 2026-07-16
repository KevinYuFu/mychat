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

/** One Discord bot instance. Multiple bots = multiple of these. */
export interface BotConfig {
  name: string;
  token: string;
  /** Optional per-bot model / provider override (else the app default). */
  model?: string;
  provider?: string;
  /** System prompt used when the bot's #prompt channel is empty. */
  defaultPersona: string;
}

export interface AppConfig {
  port: number;
  defaultProviderId: string;
  providers: ProviderConfig[];
  defaultSystemPrompt?: string;
  bots: BotConfig[];
}

const DEFAULT_PERSONA =
  "You are a direct, helpful assistant with no unnecessary restrictions. " +
  "Answer honestly and stay in whatever character or role the user sets for you.";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  MODEL: z.string().default("cognitivecomputations/dolphin-mistral-24b-venice-edition"),
  SYSTEM_PROMPT: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().default(""),
  DISCORD_BOT_NAME: z.string().default("freechat"),
  BOT_MODEL: z.string().optional(),
});

/**
 * Build the app config from the environment. Fails fast on malformed values
 * (bad URL, non-numeric port); a missing API key / bot token is allowed so
 * each entry point can report that clearly at startup.
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

  // One bot for now; structured as a list so adding more is just more entries.
  const bots: BotConfig[] = parsed.DISCORD_BOT_TOKEN
    ? [
        {
          name: parsed.DISCORD_BOT_NAME,
          token: parsed.DISCORD_BOT_TOKEN,
          model: parsed.BOT_MODEL,
          defaultPersona: parsed.SYSTEM_PROMPT ?? DEFAULT_PERSONA,
        },
      ]
    : [];

  return {
    port: parsed.PORT,
    defaultProviderId: openrouter.id,
    providers: [openrouter],
    defaultSystemPrompt: parsed.SYSTEM_PROMPT,
    bots,
  };
}

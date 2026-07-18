import {
  CategoryChannel,
  ChannelType,
  type Guild,
  TextChannel,
} from "discord.js";
import type { ChatMessage } from "../llm/types.js";

export const CHAT_CHANNEL = "chat";
export const PROMPT_CHANNEL = "prompt";

export interface Workspace {
  category: CategoryChannel;
  chat: TextChannel;
  prompt: TextChannel;
}

/**
 * Find-or-create the bot's own category and its #chat / #prompt channels.
 * Idempotent: safe to call on every startup and on every guild join.
 */
export async function ensureWorkspace(
  guild: Guild,
  botName: string,
): Promise<Workspace> {
  let category = guild.channels.cache.find(
    (c): c is CategoryChannel =>
      c.type === ChannelType.GuildCategory && c.name === botName,
  );
  if (!category) {
    category = await guild.channels.create({
      name: botName,
      type: ChannelType.GuildCategory,
    });
  }

  const chat = await ensureText(
    guild,
    category,
    CHAT_CHANNEL,
    "Talk to me here — I reply to every message you send.",
  );
  const prompt = await ensureText(
    guild,
    category,
    PROMPT_CHANNEL,
    "My personality lives here. The pinned message is my system prompt.",
  );
  return { category, chat, prompt };
}

async function ensureText(
  guild: Guild,
  category: CategoryChannel,
  name: string,
  topic: string,
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c): c is TextChannel =>
      c.type === ChannelType.GuildText &&
      c.name === name &&
      c.parentId === category.id,
  );
  if (existing) return existing;

  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    topic,
  });
}

/**
 * On first setup, seed the #prompt channel with a default persona and pin it,
 * plus a short note telling the user how to change it. No-op if already seeded.
 */
export async function ensurePersonaSeed(
  prompt: TextChannel,
  defaultPersona: string,
): Promise<void> {
  const pins = await prompt.messages.fetchPinned().catch(() => null);
  if (pins && pins.size > 0) return;

  await prompt.send(
    "📌 **This pinned message is my personality.** Edit it (or pin a new message) " +
      "to change how I behave — a roleplay character, an assistant style, rules, anything.",
  );
  const seed = await prompt.send(defaultPersona);
  await seed.pin().catch(() => {});
}

/**
 * The system prompt = the #prompt channel's pinned messages joined together,
 * falling back to the provided default if nothing is pinned.
 */
export async function readPersona(
  prompt: TextChannel,
  fallback: string,
): Promise<string> {
  const pins = await prompt.messages.fetchPinned().catch(() => null);
  if (!pins || pins.size === 0) return fallback;

  const text = [...pins.values()]
    .reverse()
    .map((m) => m.content)
    .filter(Boolean)
    .join("\n\n");
  return text || fallback;
}

/**
 * Turn recent #chat history into LLM messages (oldest first). The bot's own
 * messages become `assistant`; everyone else is `user`.
 */
export async function buildContext(
  chat: TextChannel,
  botId: string,
  limit = 20,
): Promise<ChatMessage[]> {
  const fetched = await chat.messages.fetch({ limit });
  const messages: ChatMessage[] = [];
  for (const m of [...fetched.values()].reverse()) {
    if (!m.content) continue;
    if (m.author.bot && m.author.id !== botId) continue; // skip other bots
    messages.push({
      role: m.author.id === botId ? "assistant" : "user",
      content: m.content,
    });
  }
  return messages;
}

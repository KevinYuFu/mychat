import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  type Guild,
  TextChannel,
} from "discord.js";
import type { BotConfig } from "../config.js";
import type { LLMRegistry } from "../llm/registry.js";
import { chunkMessage } from "./reply.js";
import {
  buildContext,
  CHAT_CHANNEL,
  ensurePersonaSeed,
  ensureWorkspace,
  PROMPT_CHANNEL,
  readPersona,
} from "./workspace.js";

/**
 * Start one Discord bot: it builds its own category + channels on join, and
 * replies (via the shared LLM layer) to every message in its #chat channel.
 */
export function startBot(cfg: BotConfig, registry: LLMRegistry): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const setup = async (guild: Guild) => {
    const ws = await ensureWorkspace(guild, cfg.name);
    await ensurePersonaSeed(ws.prompt, cfg.defaultPersona);
  };

  client.once(Events.ClientReady, async (c) => {
    console.log(`[${cfg.name}] online as ${c.user.tag}`);
    for (const guild of c.guilds.cache.values()) {
      await setup(guild).catch((e) =>
        console.error(`[${cfg.name}] setup failed in "${guild.name}": ${e.message}`),
      );
    }
  });

  client.on(Events.GuildCreate, (guild) =>
    setup(guild).catch((e) =>
      console.error(`[${cfg.name}] setup failed in "${guild.name}": ${e.message}`),
    ),
  );

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const channel = message.channel;
    if (!(channel instanceof TextChannel)) return;
    // Only respond in this bot's own #chat channel.
    if (channel.name !== CHAT_CHANNEL || channel.parent?.name !== cfg.name) return;

    try {
      const promptChannel = channel.parent.children.cache.find(
        (c): c is TextChannel =>
          c.type === ChannelType.GuildText && c.name === PROMPT_CHANNEL,
      );
      const system = promptChannel
        ? await readPersona(promptChannel, cfg.defaultPersona)
        : cfg.defaultPersona;
      const messages = await buildContext(channel, client.user!.id);

      await channel.sendTyping();

      const llm = registry.get(cfg.provider);
      let full = "";
      for await (const delta of llm.streamChat({
        messages,
        system,
        model: cfg.model,
      })) {
        full += delta;
      }

      full = full.trim() || "*(the model returned nothing)*";
      for (const part of chunkMessage(full)) {
        await channel.send(part);
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[${cfg.name}] message error: ${msg}`);
      await channel.send(`⚠️ Error: ${msg}`).catch(() => {});
    }
  });

  client.login(cfg.token);
  return client;
}

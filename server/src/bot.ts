import "dotenv/config";
import { loadConfig } from "./config.js";
import { startBot } from "./discord/bot.js";
import { LLMRegistry } from "./llm/registry.js";

const config = loadConfig();

if (config.bots.length === 0) {
  console.error(
    "No Discord bots configured. Set DISCORD_BOT_TOKEN (and optionally DISCORD_BOT_NAME) in .env.",
  );
  process.exit(1);
}

const registry = new LLMRegistry(config);

for (const bot of config.bots) {
  startBot(bot, registry);
}

console.log(
  `Starting ${config.bots.length} bot(s): ${config.bots.map((b) => b.name).join(", ")}`,
);

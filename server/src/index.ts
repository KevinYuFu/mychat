import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { loadConfig } from "./config.js";
import { LLMRegistry } from "./llm/registry.js";
import { chatRoutes } from "./routes/chat.js";

const config = loadConfig();
const registry = new LLMRegistry(config);

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "freechat-server" }));

// All app endpoints live under /api (the web dev server proxies /api here).
app.route("/api", chatRoutes(registry, config));

serve({ fetch: app.fetch, port: config.port });
console.log(`freechat-server listening on http://localhost:${config.port}`);

import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

// Slice 1: liveness only. The OpenRouter streaming proxy arrives in slice 2.
app.get("/health", (c) => c.json({ ok: true, service: "freechat-server" }));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`freechat-server listening on http://localhost:${port}`);

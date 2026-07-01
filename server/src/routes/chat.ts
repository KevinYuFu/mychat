import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { LLMRegistry } from "../llm/registry.js";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  model: z.string().optional(),
  system: z.string().optional(),
  provider: z.string().optional(),
});

/**
 * POST /chat — streams the model's reply as Server-Sent Events.
 * Events: `delta` {text}, then `done` {}; `error` {message} on failure.
 * Text is JSON-wrapped so newlines can't break SSE framing.
 */
export function chatRoutes(registry: LLMRegistry, config: AppConfig) {
  const app = new Hono();

  app.post("/chat", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        400,
      );
    }

    const { messages, model, system, provider } = parsed.data;

    let llm;
    try {
      llm = registry.get(provider);
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400);
    }

    return streamSSE(c, async (stream) => {
      try {
        const deltas = llm.streamChat(
          { messages, model, system: system ?? config.defaultSystemPrompt },
          c.req.raw.signal,
        );
        for await (const delta of deltas) {
          await stream.writeSSE({
            event: "delta",
            data: JSON.stringify({ text: delta }),
          });
        }
        await stream.writeSSE({ event: "done", data: "{}" });
      } catch (err) {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ message: (err as Error).message }),
        });
      }
    });
  });

  return app;
}

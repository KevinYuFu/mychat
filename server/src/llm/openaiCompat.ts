import type { ProviderConfig } from "../config.js";
import { makeClient } from "./client.js";
import type { ChatMessage, ChatRequest, LLM, ModelInfo } from "./types.js";

/**
 * LLM backed by any OpenAI-compatible Chat Completions endpoint — OpenRouter,
 * Ollama, vLLM, LM Studio, OpenAI, and friends all speak this. This class is
 * the only place that knows the wire format.
 */
export class OpenAICompatLLM implements LLM {
  constructor(private readonly provider: ProviderConfig) {}

  async *streamChat(
    req: ChatRequest,
    signal?: AbortSignal,
  ): AsyncIterable<string> {
    if (!this.provider.apiKey) {
      throw new Error(
        `No API key for provider "${this.provider.id}". Set OPENROUTER_API_KEY in .env.`,
      );
    }

    const client = makeClient(this.provider);
    const model = req.model ?? this.provider.defaultModel;

    const messages: ChatMessage[] = [];
    if (req.system) messages.push({ role: "system", content: req.system });
    messages.push(...req.messages);

    const stream = await client.chat.completions.create(
      { model, messages, stream: true },
      { signal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  listModels(): ModelInfo[] {
    return this.provider.models.map((id) => ({ id, provider: this.provider.id }));
  }
}

import type { AppConfig, ProviderConfig } from "../config.js";
import { OpenAICompatLLM } from "./openaiCompat.js";
import type { LLM, ModelInfo } from "./types.js";

/**
 * Owns one LLM instance per configured provider and hands them out by id.
 * Adding a new vendor = add a ProviderConfig (or a new LLM class in build());
 * routes and UI never change.
 */
export class LLMRegistry {
  private readonly byProvider = new Map<string, LLM>();

  constructor(private readonly config: AppConfig) {
    for (const p of config.providers) {
      this.byProvider.set(p.id, this.build(p));
    }
  }

  private build(p: ProviderConfig): LLM {
    // Only one wire format today; branch here when a native (non-OpenAI) provider arrives.
    return new OpenAICompatLLM(p);
  }

  get(providerId: string = this.config.defaultProviderId): LLM {
    const llm = this.byProvider.get(providerId);
    if (!llm) throw new Error(`Unknown provider "${providerId}".`);
    return llm;
  }

  listModels(): ModelInfo[] {
    return [...this.byProvider.values()].flatMap((llm) => llm.listModels());
  }
}

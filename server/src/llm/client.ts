import OpenAI from "openai";
import type { ProviderConfig } from "../config.js";

/**
 * One OpenAI-compatible HTTP client for a provider. We lean on the official
 * `openai` SDK (streaming, retries, SSE parsing) rather than hand-rolling it,
 * and just point it at the provider's baseURL.
 */
export function makeClient(p: ProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: p.apiKey,
    baseURL: p.baseURL,
    defaultHeaders: p.headers,
  });
}

# freechat

A private chat platform for an uncensored, self-controlled LLM.

You own the system prompt and the conversation. The backend talks to an
OpenAI-compatible endpoint — [OpenRouter](https://openrouter.ai) to start
(cheap, per-token, no infrastructure), swappable to a self-hosted model later
with no code changes.

## Layout

```
server/   Node + TypeScript (Hono) API. Holds the API key, will stream tokens.
web/      React + Vite + TypeScript frontend.
```

This is an npm workspaces monorepo.

## Setup

```bash
npm install                 # installs both workspaces
cp .env.example .env        # then fill in OPENROUTER_API_KEY
```

Get an API key at <https://openrouter.ai/keys> (sign up, add a little credit).
The default model is an uncensored fine-tune, Dolphin-Mistral 24B. Change
`MODEL` in `.env` to any slug from <https://openrouter.ai/models>.

## Run (development)

```bash
npm run dev:server          # backend on http://localhost:8787
npm run dev:web             # frontend on http://localhost:5173
```

Check the backend is up:

```bash
curl http://localhost:8787/health
# {"ok":true,"service":"freechat-server"}
```

## Status

Built slice by slice:

1. **Scaffold** — repo, backend + frontend skeletons. ← you are here
2. Backend streaming proxy to OpenRouter.
3. Web chat UI with streaming.
4. Conversation persistence (SQLite) + history.
5. Model switching (config + picker).

Deferred (lower priority): installable PWA, auth + deploy (VPS + Tailscale),
self-hosting a model on a rented GPU for full privacy.

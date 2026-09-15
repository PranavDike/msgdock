# MsgDock Runtime Architecture

MsgDock Core is independent of React and the Web workspace.

```text
Application
    │ SMTP
    ▼
SMTP adapter :1430
    ▼
MessageService
    ├── MessageRepository → SQLite
    └── EventBus → in-process lifecycle subscribers
    ▼
HTTP application :6969
    ├── API handler
    └── built Web UI
```

## Responsibilities

- `packages/contracts` — API-facing message, channel, status, and query types.
- `packages/api-client` — typed `MessagesApi` contracts and HTTP transport.
- `packages/config` — typed Node runtime configuration and environment overrides.
- `packages/core` — infrastructure-neutral message service, repository interface, and event boundary.
- `packages/storage-sqlite` — SQLite repository and schema initialization.
- `packages/protocol-smtp` — SMTP listener and email parser adapter.
- `apps/core` — runtime composition, HTTP application handler, API routes, lifecycle, and CLI.
- `apps/web` — React UI using the typed API client and HTTP transport.

## HTTP application routing

The HTTP application composes a single API handler with static hosting:

1. API mount matches are handled by the API handler.
2. Existing files under the built Web distribution are served as static assets.
3. Non-asset browser routes fall back to `index.html` for SPA routing.
4. Missing assets return `404`; API routes never fall back to the SPA.

The static root is an internal runtime concern. The default resolves to `apps/web/dist` relative to the runtime module, so `npm start` works regardless of npm workspace working-directory behavior.

## API mounting

The API handler has a configurable mount path. The local default is `/api`, yielding `/api/health` and `/api/messages` on `localhost:6969`.

The same handler can be mounted at a host root for an API domain, yielding routes such as `api.msgdock.dev/messages`. This is routing composition only: API contracts, handler behavior, and services remain the same.

## Lifecycle boundary

The runtime publishes `message.created` through an in-process `EventBus` after successful persistence. The core does not depend on Redis, BullMQ, Kafka, or worker infrastructure. Future simulation and callback consumers can subscribe at this boundary without coupling to SQLite or SMTP.

## Development

`npm run dev` starts Core on `:6969` and Vite on `:5173`. Vite proxies `/api` to Core. The default database is `.msgdock/msgdock.sqlite`, which is ignored by Git.

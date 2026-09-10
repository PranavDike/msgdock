# MsgDock Runtime Architecture

MsgDock Core is a local communication runtime. The backend is independent of React and the web workspace.

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
HTTP API :6969
    ▼
@msgdock/api-client → React UI
```

The canonical message model is owned by the shared contracts and core service. Protocol adapters normalize into that model; they do not write to storage directly.

## Packages

- `packages/contracts` — API-facing `Message`, channel, status, and query types.
- `packages/api-client` — `MessagesApi` and replaceable mock/HTTP transports.
- `packages/config` — typed Node runtime configuration and environment overrides.
- `packages/core` — infrastructure-agnostic message service, repository interface, and event boundary.
- `packages/storage-sqlite` — SQLite repository implementation and schema initialization.
- `packages/protocol-smtp` — SMTP listener and email parser adapter.
- `apps/core` — process composition, HTTP routes, lifecycle, and CLI.
- `apps/web` — React UI. Its normal runtime uses HTTP; tests can inject the mock API.

## Lifecycle boundary

The runtime currently publishes `message.created` through an in-process `EventBus` after successful persistence. The core does not depend on Redis, BullMQ, Kafka, or a worker system. Future simulation and callback consumers can subscribe at this boundary without coupling to SQLite or SMTP.

## API mounting

The HTTP handler takes a configurable base path. The local default is `/api`, producing `/api/health` and `/api/messages`. A future deployment can mount the same handler at `/messages` without a second API implementation.

## Local development

Run the runtime and web workspace in separate terminals:

```bash
npm run dev --workspace @msgdock/core-runtime
npm run dev --workspace @msgdock/web
```

The Vite development server proxies `/api` to `http://localhost:6969`. The runtime stores its default database at `.msgdock/msgdock.sqlite`; that path is ignored by Git.

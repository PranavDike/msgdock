# MsgDock Core Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Add a local MsgDock runtime that receives SMTP messages on port 1430, persists canonical messages in SQLite, exposes them through HTTP on port 6969, and lets the existing UI consume the real API through the existing transport boundary.

**Architecture:** A Node runtime composes centralized configuration, an infrastructure-agnostic core service, an in-process lifecycle event bus, a SQLite repository, an SMTP protocol adapter, and a built-in HTTP API. The HTTP router is mounted through a configurable base path so `/api/*` and root-mounted API deployments share one implementation.

**Tech Stack:** TypeScript strict mode, Node.js 20+, npm workspaces, Node `http`, `better-sqlite3`, `smtp-server`, `mailparser`, Nodemailer integration tests, Vitest, and the existing `@msgdock/contracts` / `@msgdock/api-client` packages.

**Spec:** User-provided “MsgDock Core Runtime Backend — Milestone Handoff” and “Implement Core Runtime” requirements in this conversation.

## Global Constraints

- Work on `feature/core-runtime`, created from the current `feature/web-ui` HEAD.
- Do not modify or add cloud, simulation, callback, SMS listener, or distributed queue infrastructure.
- Keep core independent of React, Vite, SQLite, SMTP packages, Redis, BullMQ, and Kafka.
- Default ports are HTTP `6969`, SMTP `1430`, and SMS `1431`; all are centralized and overridable.
- SMTP capture creates canonical messages with initial status `queued`.
- Preserve the `MessagesApi` → `MsgDockApiClient` → `MessageTransport` boundary.
- Do not commit generated databases or secrets.

---

### Task 1: Runtime configuration

**Files:**

- Modify: `packages/config/src/index.ts`
- Modify: `packages/config/package.json` if Node type declarations are required
- Test: `packages/config/src/index.test.ts`

**Produces:** `MsgDockConfig`, `loadConfig(env?)`, typed defaults, environment overrides, and validation errors for invalid ports/booleans.

- [ ] Write tests for defaults, environment overrides, invalid port, invalid boolean, and database path.
- [ ] Run `npm run test --workspace @msgdock/config`; confirm the new tests fail against the current API.
- [ ] Implement centralized nested HTTP, SMTP, SMS, database, and environment configuration.
- [ ] Run the config tests and typecheck until green.

### Task 2: Core domain and event boundary

**Files:**

- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/repository.ts`
- Create: `packages/core/src/events.ts`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/message-service.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/message-service.test.ts`

**Produces:** `MessageRepository`, `EventBus`, `InProcessEventBus`, `MessageEvent`, `MessageService`, validation, normalization, and typed domain errors.

- [ ] Write failing service tests for normalized creation, invalid input, repository delegation, and `message.created` publication.
- [ ] Implement the repository and event interfaces without infrastructure imports.
- [ ] Implement the in-process bus with typed subscription and async publication.
- [ ] Implement `MessageService.create`, `list`, and `get` with injected ID/clock functions for deterministic tests.
- [ ] Run core tests and verify no dependency on SQLite or protocol packages.

### Task 3: SQLite repository

**Files:**

- Create: `packages/storage-sqlite/package.json`
- Create: `packages/storage-sqlite/tsconfig.json`
- Create: `packages/storage-sqlite/src/sqlite-message-repository.ts`
- Create: `packages/storage-sqlite/src/index.ts`
- Test: `packages/storage-sqlite/src/sqlite-message-repository.test.ts`
- Modify: root workspace metadata and TypeScript references

**Produces:** `SQLiteMessageRepository` implementing the core repository contract, schema initialization, migration table, indexes, deterministic ordering, filtering, limit handling, and clean close.

- [ ] Add only the SQLite driver and required type dependency.
- [ ] Write failing tests using an in-memory database for initialization, insert/get, list ordering, channel/status/provider filters, and limit.
- [ ] Implement relational columns and indexes; reject unsupported cursor use honestly.
- [ ] Run storage tests and verify no database file is created by tests.

### Task 4: HTTP API runtime

**Files:**

- Create: `apps/core/package.json`
- Create: `apps/core/tsconfig.json`
- Create: `apps/core/src/http/api-handler.ts`
- Create: `apps/core/src/http/http-server.ts`
- Create: `apps/core/src/runtime.ts`
- Create: `apps/core/src/cli.ts`
- Test: `apps/core/src/http/api-handler.test.ts`
- Modify: root TypeScript references and scripts as needed

**Produces:** One Node HTTP handler supporting configurable `/api` or root mounting, health/list/get routes, query parsing, structured 400/404/500 responses, and startup/shutdown composition.

- [ ] Write failing HTTP handler tests for health, list, get, filtering, invalid query, not found, and root-mounted routing.
- [ ] Implement request routing against `MessageService`, JSON responses, and structured errors.
- [ ] Implement server lifecycle and runtime composition with config, repository, core service, and event bus.
- [ ] Add graceful shutdown and partial-startup cleanup.
- [ ] Run handler tests and an ephemeral-port server test.

### Task 5: SMTP protocol adapter

**Files:**

- Create: `packages/protocol-smtp/package.json`
- Create: `packages/protocol-smtp/tsconfig.json`
- Create: `packages/protocol-smtp/src/smtp-server.ts`
- Create: `packages/protocol-smtp/src/index.ts`
- Test: `packages/protocol-smtp/src/smtp-server.test.ts`
- Modify: runtime composition in `apps/core/src/runtime.ts`

**Produces:** SMTP listener with optional local authentication, email parsing, sender/recipient/subject/body extraction, canonical `MessageService.create` calls, and clean start/stop.

- [ ] Add SMTP/parser dependencies and Nodemailer only where required for integration tests.
- [ ] Write a real SMTP client test against an ephemeral SMTP listener and assert normalized service/repository output.
- [ ] Implement the adapter with no storage dependency and structured startup/parse errors.
- [ ] Run the SMTP integration test and verify authentication/configuration behavior.

### Task 6: HTTP transport and real UI runtime path

**Files:**

- Modify: `packages/api-client/src/index.ts`
- Test: `packages/api-client/src/http-transport.test.ts`
- Create or modify: `apps/web/src/api/http-api.ts`, `apps/web/vite.config.ts`, and `apps/web/src/App.tsx`
- Modify: `apps/web/package.json` if needed

**Produces:** `HttpMessageTransport` using the existing contracts and a normal runtime path that uses HTTP while preserving mock injection for tests/isolated development.

- [ ] Write transport tests for URL/query construction, success responses, and structured HTTP errors.
- [ ] Implement the transport with injectable `fetch` for deterministic tests.
- [ ] Configure the web runtime default and development proxy without changing presentation components.
- [ ] Run web tests and verify the mock transport remains available.

### Task 7: End-to-end acceptance, documentation, and verification

**Files:**

- Create: `apps/core/src/runtime.integration.test.ts` or an equivalent focused integration test
- Modify: `docs/architecture/README.md`
- Modify: `docs/api/README.md`
- Modify: `README.md` with runtime commands/configuration

- [ ] Start the runtime with a temporary SQLite database and ephemeral test ports.
- [ ] Send a real Nodemailer message through SMTP.
- [ ] Query HTTP list/get and assert sender, recipient, subject, body, channel, provider, queued status, and timestamp.
- [ ] Verify the web UI can consume the HTTP transport against the running API.
- [ ] Run `npm install`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
- [ ] Inspect the final diff for secrets, generated databases, hardcoded ports, dependency direction, and mock transport preservation.
- [ ] Commit the completed implementation with `feat(core): add local communication runtime`.

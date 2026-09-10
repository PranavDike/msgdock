# MsgDock — Open-source communication sandbox

An open-source provider-aware communication sandbox for local development and CI.

MsgDock helps developers capture, inspect, and test application communications
without sending real messages to real users or external communication providers.

## Project Status

MsgDock is currently in early development.

The initial focus is the open-source MsgDock Core: a local-first communication
sandbox with a provider-aware architecture.

The project is designed with a future hosted offering, MsgDock Cloud, in mind.
Cloud-specific functionality is intentionally kept separate from the open-source
core.

## Initial Channels

- Email
- SMS

Planned:

- WhatsApp
- RCS
- Push
- Voice
- OTP
- Webhooks

## Architecture

MsgDock separates:

- communication channels
- communication providers
- domain contracts
- API transport
- UI
- backend infrastructure

The UI communicates through a typed API client.

Development can use mock transport:

```text
UI
 ↓
API Client
 ↓
Mock Transport
 ↓
Mock Service
```

The same UI can later use the real backend:

```text
UI
 ↓
API Client
 ↓
HTTP Transport
 ↓
Backend
 ↓
Provider
```

## Repository structure

```text
apps/       Applications
packages/   Shared packages
mocks/      Mock infrastructure
docs/       Architecture and API documentation
```

## Development

### Requirements

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Run formatting checks

```bash
npm run format:check
```

### Run linting

```bash
npm run lint
```

### Run type checking

```bash
npm run typecheck
```

### Run tests

```bash
npm run test
```

### Build

```bash
npm run build
```

## Development roadmap

- Architecture and contracts
- Terminal-style web UI
- Dynamic UI backed by mock APIs
- Backend API
- Provider integrations
- CI/testing improvements

## Open Source and Cloud

MsgDock Core is open source and licensed under the Apache License 2.0.

The architecture intentionally separates the open-source core from potential
commercial cloud services.

The core is intended to provide a complete local development experience.

Future cloud capabilities may include:

- Shared development environments
- Team collaboration
- Authentication and access control
- Cloud-hosted message storage
- Usage management
- Advanced integrations
- Enterprise features

These capabilities are not currently part of the project and are not a promise
of availability.

## License

MsgDock is licensed under the Apache License 2.0.

See [LICENSE](./LICENSE) for the full license text.

## Run the local core runtime

The first working runtime path captures real SMTP messages into SQLite and exposes them through the existing API client:

```text
Nodemailer → localhost:1430 → MsgDock Core → SQLite → localhost:6969/api/messages → Web UI
```

Start the runtime and UI in separate terminals:

```bash
npm run dev --workspace @msgdock/core-runtime
npm run dev --workspace @msgdock/web
```

Defaults:

- HTTP API: `localhost:6969`
- SMTP ingestion: `localhost:1430`
- SMS listener: disabled, reserved for `localhost:1431`
- SQLite database: `.msgdock/msgdock.sqlite`

Configuration is centralized in `packages/config` and can be overridden with `MSGDOCK_HTTP_HOST`, `MSGDOCK_HTTP_PORT`, `MSGDOCK_API_BASE_PATH`, `MSGDOCK_SMTP_HOST`, `MSGDOCK_SMTP_PORT`, `MSGDOCK_SMTP_ENABLED`, `MSGDOCK_SMTP_USER`, `MSGDOCK_SMTP_PASSWORD`, `MSGDOCK_SMS_HOST`, `MSGDOCK_SMS_PORT`, `MSGDOCK_SMS_ENABLED`, and `MSGDOCK_DATABASE_PATH`.

Example Nodemailer configuration:

```ts
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1430,
  auth: { user: 'msgdock', pass: 'msgdock' },
});
```

See [runtime architecture](./docs/architecture/README.md) and the [HTTP API](./docs/api/README.md) for route and boundary details.

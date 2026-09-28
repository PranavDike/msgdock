# MsgDock

An open-source, provider-aware communication sandbox for local development and CI.

MsgDock captures application communications locally so developers can inspect them without delivering them to real users or external providers.

**[Project site](https://pranavdike.github.io/msgdock/)** · **[GitHub repository](https://github.com/PranavDike/msgdock)**

## Quick start

Requirements: Node.js 20+ and npm.

### Development

```bash
npm install
npm run dev
```

This starts:

- Web UI: `http://localhost:5173`
- Core API: `http://localhost:6969/api/*`
- SMTP ingestion: `localhost:1430`
- SMS ingestion: `localhost:1431` when SMS capture is enabled

Vite proxies browser `/api/*` requests to the Core runtime. Stop the command with `Ctrl+C` to stop both development processes.

SMS capture is opt-in by default:

```bash
MSGDOCK_SMS_ENABLED=true npm run dev
```

### Local application build

```bash
npm install
npm run build
npm start
```

The Core runtime serves the built Web UI and API from `http://localhost:6969/`. SMTP ingestion remains available at `localhost:1430`, and SMS ingestion is available at `localhost:1431` when enabled.

For example, an existing Nodemailer application can use MsgDock by changing only its SMTP transport configuration:

```ts
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1430,
  auth: { user: 'msgdock', pass: 'msgdock' },
});
```

Captured mail is stored locally in `.msgdock/msgdock.sqlite` by default. MsgDock captures communications; it does not deliver them externally.

## SMS capture

MsgDock currently supports local SMS capture through a lightweight HTTP ingestion endpoint.

Enable SMS capture:

```bash
MSGDOCK_SMS_ENABLED=true npm run dev
```

Then send an SMS-shaped message:

```bash
curl -s -X POST http://localhost:1431/messages \
  -H "Content-Type: application/json" \
  -d '{"from":"+919876543210","to":"+919876543211","body":"Hello from MsgDock SMS"}'
```

The captured message is normalized into the same message model used by email:

```text
channel  = sms
protocol = http
provider = local
status   = queued
```

SMPP and external SMS provider integrations are planned for future releases. The current HTTP adapter is intended for local development and runtime validation.

## Runtime architecture

```text
                         ┌── SMTP :1430 ──→ email
Application communication ┤
                         └── HTTP :1431 ──→ sms
                                      │
                                      ↓
                                MsgDock Core
                                      │
                           ┌──────────┴──────────┐
                           ↓                     ↓
                        SQLite              Event Bus
                           │                     │
                           ↓                     ↓
                    HTTP API :6969             SSE
                           │
                           ↓
                        Web UI
```

The Web UI uses the typed `@msgdock/api-client` boundary and HTTP transport when the Core runtime is available.

The local API is mounted at `/api` by default, for example `http://localhost:6969/api/messages`. The same API handler can also be mounted at a host root (for example, `https://api.msgdock.dev/messages`) without duplicating contracts or service behavior.

See the [runtime architecture](./docs/architecture/README.md) and [HTTP API](./docs/api/README.md) for details.

## Commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

## License

MsgDock is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).

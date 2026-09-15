# MsgDock

An open-source, provider-aware communication sandbox for local development and CI.

MsgDock captures application communications locally so developers can inspect them without delivering to real users or external providers.

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

Vite proxies browser `/api/*` requests to the Core runtime. Stop the command with `Ctrl+C` to stop both development processes.

### Local application build

```bash
npm install
npm run build
npm start
```

The Core runtime serves the built Web UI and API from `http://localhost:6969/`. SMTP ingestion remains available at `localhost:1430`.

For example, an existing Nodemailer application can use MsgDock by changing only its SMTP transport configuration:

```ts
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1430,
  auth: { user: 'msgdock', pass: 'msgdock' },
});
```

Captured mail is stored locally in `.msgdock/msgdock.sqlite` by default. MsgDock captures mail; it does not deliver it externally.

## Runtime architecture

```text
Application → SMTP :1430 → MsgDock Core → SQLite → HTTP API :6969 → Web UI
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

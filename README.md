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

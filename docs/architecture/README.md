# MsgDock Architecture

## Goal

MsgDock provides a safe communication sandbox for local development and CI.

Applications should be able to test communication workflows without
contacting real users or external communication providers.

## Core principles

### 1. Channel and provider are separate

A channel describes the communication medium:

- Email
- SMS

A provider describes the underlying delivery implementation.

The domain model must not couple a channel to a specific provider.

### 2. Contracts are shared

The API/domain contracts live in:

`packages/contracts`

The UI, API client, mocks, and future backend consume these contracts.

### 3. UI does not own API models

The UI communicates through:

`packages/api-client`

It does not import mock seed data directly.

### 4. Transport is replaceable

The API client exposes a transport boundary.

Development:

UI → API Client → Mock Transport

Production:

UI → API Client → HTTP Transport → Backend

The UI should not need to change when switching transports.

### 5. Mock data is deterministic

Mock data exists for development and testing.

Mock infrastructure must never contact real communication providers by default.

## Initial architecture

```text
                    ┌──────────────┐
                    │      Web     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  API Client  │
                    └──────┬───────┘
                           │
                  ┌────────┴─────────┐
                  │                  │
           Mock Transport      HTTP Transport
                  │                  │
                  ▼                  ▼
             Mock Service        Backend API
                  │
                  ▼
             Mock Storage
```

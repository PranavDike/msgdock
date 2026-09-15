# MsgDock HTTP API

By default, the local runtime mounts the API under `/api` on `localhost:6969`.

The same handler can be mounted at an API host root in another deployment topology. For example, `/api/messages` locally and `/messages` on `api.msgdock.dev` have identical behavior.

## Health

```http
GET /api/health
```

```json
{ "status": "ok", "service": "msgdock-core" }
```

## List messages

```http
GET /api/messages
```

Supported query parameters:

- `channel`: `email` or `sms`
- `status`: `queued`, `sent`, `delivered`, or `failed`
- `provider`: provider identifier
- `limit`: integer from 1 to 1000
- `cursor`: currently rejected with `400`; cursor pagination is not implemented

Example:

```http
GET /api/messages?channel=email&status=queued&limit=50
```

```json
{ "data": [] }
```

Results are ordered newest first by `createdAt`, with message ID as a deterministic tie-breaker.

## Get a message

```http
GET /api/messages/:id
```

```json
{ "data": {} }
```

Unknown IDs return `404`. Invalid query values return a structured `400` error.

## SMTP capture

The default SMTP listener is `localhost:1430`. It accepts SMTP clients such as Nodemailer, parses email, and stores an `email` message with provider `smtp` and initial status `queued`. MsgDock does not deliver captured mail externally.

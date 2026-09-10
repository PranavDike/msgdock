# MsgDock HTTP API

The local runtime exposes the API under `/api` by default on `localhost:6969`.

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
- `cursor`: currently rejected with `400`; cursor pagination is not implemented yet

Example:

```http
GET /api/messages?channel=email&status=queued&limit=50
```

```json
{ "data": [] }
```

Results are ordered newest first using `createdAt`, with the message ID as a deterministic tie-breaker.

## Get a message

```http
GET /api/messages/:id
```

```json
{ "data": {} }
```

Unknown IDs return `404`. Invalid query values return `400` with a structured error:

```json
{
  "error": {
    "code": "invalid_query",
    "message": "..."
  }
}
```

## SMTP capture

The default SMTP listener is `localhost:1430`. It accepts ordinary SMTP clients such as Nodemailer, parses the email, and stores it as an `email` message with provider `smtp` and initial status `queued`. MsgDock does not deliver captured mail externally.

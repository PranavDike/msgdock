````md
# API Contracts

The API contract is defined in:

`packages/contracts`

## Messages

### List messages

```http
GET /messages

Supported query parameters:

channel
status
provider
limit
cursor

Example:

GET /messages?channel=sms&status=delivered

Response:

{
  "data": [],
  "nextCursor": "..."
}
Get message
GET /messages/:id

Response:

{
  "data": {}
}
Contract ownership

The backend implementation must conform to the shared contracts.

The UI must consume the API through @msgdock/api-client.
```
````

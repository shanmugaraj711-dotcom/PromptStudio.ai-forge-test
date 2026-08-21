# PromptStudio AI — Integration Contract v1

## Status
Development contract. Implement adapters against `development`; do not add integration business logic to `main` directly.

## Core endpoint
`POST /api/v1/prompt`

The endpoint reuses the existing server-authoritative generation engine. It accepts the same authenticated generation request shape currently used by the application and returns the existing structured result.

### Request
```json
{
  "requestId": "client-generated-id-8-to-128-chars",
  "idea": "optional user request",
  "aiModel": "gemini",
  "category": "image",
  "image": {
    "mimeType": "image/jpeg",
    "data": "base64-data",
    "name": "reference.jpg"
  }
}
```

### Response
Successful responses preserve the current core result shape:
```json
{
  "prompt": "...",
  "perspectives": [],
  "intelligence": {},
  "historyId": "...",
  "quota": {},
  "creditsRemaining": 0,
  "creditCost": 0
}
```

### Error envelope
```json
{
  "code": "stable_machine_code",
  "message": "human-readable message"
}
```

Common codes include `invalid_request`, `invalid_options`, `invalid_image`, `credits_required`, `request_in_progress`, `generation_failed`, `server_configuration_error` and `generation_unavailable`.

## Integration principles
- Never give external integrations direct Firestore write access.
- Never expose Firebase Admin credentials or payment secrets.
- Every generation request must carry a unique request ID.
- Integrations must use the same credit/quota reservation path as the web application.
- Billing and entitlement decisions remain server authoritative.
- WhatsApp and plugin adapters must not implement their own credit ledger.

## Future scoped integration authentication
The next implementation should introduce scoped integration credentials separate from normal user session tokens. Credentials should be revocable, minimally scoped, rate-limited, and hashed at rest. The integration identity must map to an existing PromptStudio account or an explicitly supported anonymous/trial policy.

## Future support contract
A support adapter should expose only:
- transaction lookup by authenticated account/reference;
- credit/payment issue creation;
- generation issue creation;
- account/help request creation.

Support adapters should return a support reference ID rather than exposing internal Firestore documents.

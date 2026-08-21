# PromptStudio Integration Contract v1

## Purpose
One server-authoritative contract for Web, WhatsApp Business and future plugins. Integrations never write directly to Firestore and never implement credit/billing logic themselves.

## Authentication
Integration requests must eventually use a short-lived, scoped credential. Required claims/context:
- integration id
- user id
- scopes
- issued-at / expiry
- request id

Until provider credentials are configured, this contract is documentation-only; no fake authentication mode is enabled in production.

## Image → Prompt
`POST /api/v1/prompt`

Required:
- authenticated user context
- `requestId` (8–128 chars, `[A-Za-z0-9_-]`)
- `aiModel`
- `category`
- either `idea` (3–6000 chars) or a reference image

Reference image v1:
- JPEG only
- base64 data string
- maximum 4,000,000 characters

The endpoint returns the same server-authoritative generation result used by the existing credit-aware engine. It must not create a second wallet, quota or Gemini implementation.

## Transaction lookup
Future integration endpoint contract:
`GET /api/v1/transactions/:transactionId`

Returns only the authenticated user's permitted transaction fields:
- transaction id
- date/time
- amount
- currency
- payment status
- credit entitlement status

Never expose payment secrets or internal webhook payloads.

## Support
Future integration endpoint contract:
`POST /api/v1/support`

Supported initial intents:
- payment_issue
- credits_missing
- transaction_question
- generation_issue
- account_help

A support request may include a transaction id. The server resolves ownership before attaching transaction context.

## Common response envelope
Success responses contain domain data. Errors use:
```json
{
  "code": "stable_machine_code",
  "message": "Safe human-readable message"
}
```

Integration clients must branch on `code`, not message text.

## Idempotency
Every mutating integration operation must carry a unique request/idempotency key. Replays must return the original result when the original operation completed successfully and must not double-charge credits.

## Rate limits
Integration traffic gets a separate policy from browser traffic. Limits must be enforced server-side and keyed to authenticated integration + user where applicable.

## Plugin contract
The first plugin exposes one action only:
**Analyze reference image → return PromptStudio prompt + perspectives.**

The plugin does not duplicate:
- authentication UI
- wallet
- billing
- transaction ledger
- support database

## WhatsApp contract
WhatsApp is a channel adapter. Incoming messages are normalized into PromptStudio intents and passed to the same support/transaction services. Media handling must eventually use the verified WhatsApp provider credentials configured by the project owner.

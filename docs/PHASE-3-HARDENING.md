# Phase 3 Hardening

## Completed
- Single `development` branch for all future work.
- Production `main` is not a development target.
- Shared integration request ID generation and response headers.
- JSON content-type and payload-size guard at the integration boundary.
- Stable integration error envelope with request IDs.
- Method enforcement for the v1 prompt endpoint.
- Existing credit-aware generation remains the authoritative engine.

## Security model
Integration endpoints must remain server-authoritative. External channels must not receive direct Firestore write access, Firebase Admin credentials, payment secrets, or access to sensitive collections.

## Idempotency
The existing generation core owns request identity/idempotency behavior. Future external credentials must be scoped and tied to the authenticated integration identity. Do not invent a second credit reservation mechanism in an adapter.

## Release gate
All Phase 3 changes stay on `development` until build, lint, tests, critical-flow regression, security review and preview verification pass. No automatic promotion to `main`.

# Security Audit — Launch Gate

## Current findings

- Firebase ID-token authentication is enforced on prompt generation.
- Admin writes require a verified founder account and recent authentication.
- Reference images are limited to JPEG and 4,000,000 characters of base64 data at the generation API boundary.
- API responses from prompt generation use `Cache-Control: no-store`.
- `vercel.json` now applies baseline browser security headers.

## Remaining security work

- Durable per-user/IP rate limiting for expensive generation and payment endpoints is still required before the security gate can be marked fully green.
- A full CSP allowlist should be validated against production third-party dependencies before enabling a restrictive policy.
- Production abuse/monitoring alerts should be verified separately.

This file records the launch-gate state; it does not claim the remaining items are complete.

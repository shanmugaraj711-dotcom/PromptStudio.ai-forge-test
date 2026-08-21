# Phase 3 Execution Checklist

## Completed foundation
- [x] Production baseline documented
- [x] Current system map documented
- [x] Master blueprint documented
- [x] Reference architecture research documented
- [x] API v1 contract documented
- [x] Thin Image → Prompt API adapter implemented
- [x] Single development branch established

## Remaining implementation before WhatsApp provider setup
- [ ] Shared generation service extraction without behavior change
- [ ] Shared transaction lookup service
- [ ] Shared support-ticket/service boundary
- [ ] Versioned integration auth contract
- [ ] Integration request-id and idempotency utilities
- [ ] Integration-specific rate-limit policy
- [ ] Common API error envelope
- [ ] API contract tests
- [ ] Regression tests for existing web generation and credits
- [ ] Integration test for concurrent credit reservation
- [ ] Plugin adapter contract
- [ ] WhatsApp adapter contract (provider-neutral until credentials/webhook are configured)
- [ ] Integration analytics/events
- [ ] Preview verification

## Project-owner setup required later
- [ ] WhatsApp Business credentials
- [ ] WhatsApp webhook verification/configuration
- [ ] Provider environment variables/secrets
- [ ] Production webhook URL

## Release gate
No Phase 3 code is promoted to `main` until build, lint, tests, critical-flow regression, security review and preview verification pass and the production release is explicitly approved.

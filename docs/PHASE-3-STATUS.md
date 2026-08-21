# PromptStudio AI — Phase 3 Status

## Branch policy
- `main` is production and must not be used for development.
- `development` is the single active development branch for all future work.
- All Phase 3 work and future improvements belong on `development`.

## Completed foundation
- Current System Map
- Master Blueprint
- Safety Baseline
- Reference Research
- Integration API v1 contract
- Thin `/api/v1/prompt` adapter
- Integration security boundary
- Development branch policy

## Current integration architecture

`Web / future WhatsApp / future Plugin -> /api/v1/prompt -> existing credit-aware generation core`

The adapter delegates to the existing core so no second credit ledger or generation implementation is created.

## Remaining implementation
- automated API contract tests
- production regression test run against a development preview
- scoped integration credentials
- transaction/support service boundary
- WhatsApp support adapter
- first Image → Prompt plugin adapter
- integration observability/analytics
- preview deployment verification

## External prerequisites
Live WhatsApp requires provider/business credentials and webhook configuration. A published plugin requires the target platform's publication credentials/configuration. These must be configured outside source control.

## Release gate
No development change is considered production-ready until lint, build, tests, targeted auth/credits/generation/payment/support regressions, preview verification and diff review all pass. Production promotion is a separate deliberate release action.

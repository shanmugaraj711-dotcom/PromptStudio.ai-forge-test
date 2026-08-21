# PromptStudio AI — Development Rules

## Branch policy
- `main` is production and must not receive development work directly.
- `development` is the single active branch for all future development.
- Do not create additional feature branches unless the project owner explicitly changes this policy.
- All Phase 3+ work must land on `development` first.

## Release gate
1. Build and lint.
2. Run automated tests.
3. Verify critical existing flows.
4. Review changed files and security boundaries.
5. Deploy/inspect a preview where available.
6. Only promote to `main` after the production release is explicitly approved.

## External integrations
WhatsApp Business authentication, webhook and provider configuration are intentionally deferred to the project owner. Code must be provider-ready without pretending the integration is live.

## Safety
Never change pricing, credit economics, payment behavior, authentication, or production routing as an incidental part of an integration feature.

# PromptStudio AI — Development Policy

## Branch policy

- `main` is production and is protected from development work.
- `development` is the single active development branch for all future PromptStudio changes.
- Do not create additional feature/fix development branches unless explicitly required for an emergency rollback or release operation.
- All new work must land on `development` first.
- Validate `development` before any future production release.

## Release policy

1. Implement on `development`.
2. Run lint/build/tests and targeted regression checks.
3. Verify preview deployment.
4. Review the diff against `main`.
5. Keep `main` unchanged until a release is deliberately approved.

## Safety rule

Never use production as the experimentation environment. Existing working behavior has priority over new features.

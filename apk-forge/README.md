# PromptStudio AI APK Forge

This directory is isolated from the production web application and is the home for the first PromptStudio AI Android build.

## Target

Create an Android APK for PromptStudio AI while keeping the production web app untouched.

## Architecture

- Android shell: native Kotlin project.
- App content: configurable HTTPS web origin.
- Default development origin: Forge preview URL, not production.
- No Firebase Admin credentials or server secrets in the APK.
- Customer binaries are reference evidence only and are never executed.

## Build batches

1. **Foundation** — Android project, app identity, modern shell, safe WebView configuration.
2. **Product bridge** — authentication/session handoff, file chooser, uploads, back navigation, external links.
3. **Build pipeline** — isolated GitHub Actions Android build and APK artifact upload.
4. **Verification** — lint/build checks, APK inspection, install smoke test on an isolated runner.
5. **Release hardening** — signing configuration via CI secrets and production-origin approval.

Production deployment is explicitly out of scope for this Forge branch.

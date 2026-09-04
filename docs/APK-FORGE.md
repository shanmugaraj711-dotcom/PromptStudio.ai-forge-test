# PromptStudio APK Forge

## Isolation contract

APK Forge is developed only on `forge/apk-forge`.

- Never commit Forge work to `main`.
- Never deploy Forge artifacts to the production site.
- Never change production Firebase, billing, quotas, or environment configuration as part of Forge.
- Integration into production requires explicit approval and a separate review/merge step.

## Product contract

APK Forge turns a customer's existing product references into a configurable Android application and an isolated build artifact.

Customers can provide:

1. Website/project URL and app description.
2. Screenshots or screen recordings.
3. Existing documentation.
4. Reference files.
5. A Windows executable uploaded as a reference. If a customer renames an `.exe` to `.txt`, Forge must inspect the bytes/type and report that it appears executable rather than treating it as ordinary text.

Reference files are context only. They must never be executed by the application or build pipeline.

## Generic APK configuration

The Android wrapper is intentionally reusable. A build is defined by configuration rather than a hardcoded website:

| Field | Purpose | Example |
|---|---|---|
| `appName` | Android display name | `My Website App` |
| `webOrigin` | HTTPS website origin loaded by the WebView | `https://example.invalid` |
| `packageId` | Android application ID | `com.example.mywebsiteapp` |
| `versionName` | Human-readable release version | `1.0.0` |
| `versionCode` | Positive Android build number | `1` |

The example schema lives at `apk-forge/config/app-config.example.json`.

The GitHub Actions Forge build accepts these values as manual workflow inputs and passes them into Gradle. The default build remains a safe non-production placeholder origin. The production `promptstudioai.in` origin is explicitly blocked by the Forge workflow.

## Forge stages

1. **Intake** — validate size/type, collect description, screenshots and optional documentation.
2. **Evidence normalization** — identify likely executable/binary content independently of the filename; preserve safe metadata; extract text only from explicitly supported text/document formats.
3. **Product understanding** — combine visible evidence with the customer's intent and distinguish observed facts from assumptions.
4. **Android plan** — produce screens, navigation, state model, data/API requirements, accessibility requirements and acceptance criteria.
5. **Configuration** — generate the app name, website origin, package ID and version configuration for the reusable Android wrapper.
6. **Implementation brief** — produce a coding-agent-ready Android brief with recommended stack and file/module boundaries.
7. **Build handoff** — hand the generated project/configuration to an isolated Android build runner. The build runner must be separate from the production web runtime.
8. **Verification** — run compile/unit/UI checks, inspect APK metadata, verify checksum, and report build/test results before customer delivery.

## Safety boundaries

- Never execute customer-uploaded EXE/binary files.
- Never infer that a `.txt` extension makes binary content safe text.
- Enforce request/file size limits before processing.
- Do not store raw executable contents in analytics.
- Do not place secrets or production credentials in Forge artifacts.
- Build jobs must be isolated and disposable.
- Customer-provided code is untrusted input.
- Only HTTPS website origins are accepted by the APK wrapper.
- The Forge workflow blocks the production website origin until production integration is explicitly approved.

## Current branch scope

The generic Android wrapper and isolated debug build pipeline are now implemented on `forge/apk-forge`. The next product slice is connecting the authenticated Forge UI/API to submit a validated configuration and trigger an isolated build. No production deployment or merge is performed automatically.

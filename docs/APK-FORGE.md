# PromptStudio APK Forge

## Isolation contract

APK Forge is developed only on `forge/apk-forge`.

- Never commit Forge work to `main`.
- Never deploy Forge artifacts to the production site.
- Never change production Firebase, billing, quotas, or environment configuration as part of Forge.
- Integration into production requires explicit approval and a separate review/merge step.

## Product contract

APK Forge turns a customer's existing product references into a build-ready Android application specification and implementation workflow.

Accepted evidence can include:

1. Customer description of the app and desired changes.
2. Screenshots or screen recordings.
3. Existing documentation.
4. Reference files.
5. A Windows executable uploaded as a reference. If a customer renames an `.exe` to `.txt`, the system must not trust the filename. It should inspect the uploaded bytes/type and report that the content appears executable rather than treating it as ordinary text.

Reference files are context only. They must never be executed by the application or build pipeline.

## Forge stages

1. **Intake** — validate size/type, collect description, screenshots and optional documentation.
2. **Evidence normalization** — identify likely executable/binary content independently of the filename; preserve safe metadata; extract text only from explicitly supported text/document formats.
3. **Product understanding** — combine visible evidence with the customer's intent and distinguish observed facts from assumptions.
4. **Android plan** — produce screens, navigation, state model, data/API requirements, accessibility requirements and acceptance criteria.
5. **Implementation brief** — produce a coding-agent-ready Android brief with recommended stack and file/module boundaries.
6. **Build handoff** — hand the generated project/specification to an isolated Android build runner. The build runner must be separate from the production web runtime.
7. **Verification** — run compile/unit/UI checks, inspect the APK metadata, and report build/test results before any customer delivery.

## Safety boundaries

- Never execute customer-uploaded EXE/binary files.
- Never infer that a `.txt` extension makes binary content safe text.
- Enforce request/file size limits before processing.
- Do not store raw executable contents in analytics.
- Do not place secrets or production credentials in Forge artifacts.
- Build jobs must be isolated and disposable.
- Customer-provided code is untrusted input.

## Current branch scope

The first implementation slice is the authenticated Forge intake/normalization contract and a build-ready handoff document. Actual Android compilation should run only in a dedicated isolated build environment; it must not be attempted inside the Vercel production serverless function.

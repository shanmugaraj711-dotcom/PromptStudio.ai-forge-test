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

## Payment and review contract

The customer flow is intentionally:

`SUBMIT → VALIDATE → PAY → PENDING_REVIEW → APPROVED → BUILD → VERIFY → READY`

A successful payment does not itself authorize a build.

### Pricing

The current APK Forge build price is `PRODUCT_CONFIG.pricing.apkForge.buildPriceInr` and the server is the sole authority for the Razorpay order amount. The client must never supply or override the payable amount.

### Immutable identifiers and order idempotency

Every paid request receives a server-generated `forgeRequestId`. The request stores the associated Razorpay order/payment identifiers and they are never replaced by client-supplied values.

Razorpay's documented Orders API does not expose the same request-idempotency mechanism used by its payout APIs, so Forge does not pretend an unsupported Razorpay idempotency header exists. Instead, Forge makes order creation idempotent at our application boundary:

1. A Firestore transaction reserves order creation for the `forgeRequestId`.
2. A second concurrent request sees the reservation and does not create another order.
3. The Razorpay receipt is deterministically derived from the `forgeRequestId` and is unique.
4. If the process dies after Razorpay creates the order but before Firestore stores its ID, a later retry queries Razorpay by that receipt and validates the exact amount, currency, `forgeRequestId`, and user note before attaching the existing order.
5. A request with an already-linked order always reuses that order rather than creating another one.

This closes the customer double-click/network-retry case without relying on an undocumented provider feature. Razorpay documents receipt as a unique internal reference and supports fetching orders by receipt. cite_note_razorpay_order_receipt

### Payment verification and reconciliation

Browser checkout verification and the Razorpay webhook both require a captured Razorpay payment and exact amount/order ownership before transitioning:

`PAYMENT_PENDING → PENDING_REVIEW`

The transition is compare-and-set guarded, so webhook + browser callback + reconciliation cannot promote the same request twice.

A scheduled server-side reconciliation endpoint runs hourly. It finds Forge requests still `PAYMENT_PENDING`, fetches the Razorpay order and its linked payments, and promotes the request only when a captured payment exactly matches the stored order amount. This is the recovery path for a successful Razorpay payment whose webhook or browser callback was delayed/missed. Razorpay documents both fetching an order and fetching all payments for an order. cite_note_razorpay_reconciliation

The reconciliation endpoint is protected by `CRON_SECRET`/`APK_FORGE_RECONCILE_SECRET`; it is not a public customer action.

### State-transition guard

Administrative and scheduled transitions use compare-and-set semantics: the transition is valid only when the stored status is exactly the expected previous state. A second concurrent action gets a conflict/no-op and cannot mutate the already-transitioned request.

Examples:

- `PENDING_REVIEW → APPROVED` only if still `PENDING_REVIEW`.
- `PENDING_REVIEW → REJECTED` only if still `PENDING_REVIEW`.
- `PENDING_REVIEW → EXPIRED` only if still `PENDING_REVIEW`.
- `APPROVED → BUILDING` only if still `APPROVED`.

This prevents double-clicks, two admin tabs, and expiry/admin races from causing double builds or approve-then-refund conflicts.

### Refund contract

Refunds are initiated automatically by the server for:

- Admin rejection.
- 72-hour review expiry.
- A payment/reconciliation failure that leaves a paid request without a valid Forge request.

The server calls Razorpay's refund API using the stored payment reference. Refund execution is idempotent: the system records refund state, provider reference, attempt count and last error before considering the refund complete. Retryable failures remain `REFUND_PENDING` and are retried by the refund worker/job. Non-retryable or repeatedly failing refunds are surfaced to the admin queue/alert path. The system never silently marks an unsuccessful refund as successful and never issues a second refund for an already-completed provider refund.

Post-approval customer cancellation is **not** automatically refunded.

### Review expiry

A scheduled server-side job is required to process paid requests that remain `PENDING_REVIEW` for more than `reviewExpiryHours` (currently 72 hours). The expiry transition is guarded by the same compare-and-set rule, so an approval that wins the race prevents expiry/refund.

### Daily build limit

`dailyBuildLimit` applies to builds admitted into the build pipeline, not rejected or expired requests. Rejected/expired requests therefore do not consume a build slot. The limit is reserved atomically when an approved request enters `BUILDING`, preventing concurrent approvals from exceeding the daily cap.

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

The generic Android wrapper, isolated debug build pipeline, server-priced payment order flow, payment verification, webhook promotion, and hourly Razorpay reconciliation path are implemented on `forge/apk-forge`. Payment/review integration must preserve the state and refund contracts above before any live customer build button is enabled. No production deployment or merge is performed automatically.

<!--
Reference notes for the external Razorpay documentation used when this contract was designed:
- Orders API: https://razorpay.com/docs/api/orders/create/
- Fetch orders by receipt: https://razorpay.com/docs/api/orders/fetch-all/
- Fetch payments for an order: https://razorpay.com/docs/api/orders/fetch-payments/
- Fetch an order: https://razorpay.com/docs/api/orders/fetch-with-id/
-->

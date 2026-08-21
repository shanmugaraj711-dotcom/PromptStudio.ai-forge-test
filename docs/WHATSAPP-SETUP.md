# WhatsApp Business Integration — Provider Setup

The codebase is provider-ready but the actual WhatsApp Business authentication/webhook configuration is intentionally left for the project owner.

## Owner setup checklist
1. Create/confirm the WhatsApp Business Platform app and business phone number.
2. Obtain the provider access token and required identifiers.
3. Configure the webhook callback URL to the deployed PromptStudio webhook endpoint.
4. Configure the webhook verification token/challenge.
5. Subscribe to the required messaging events.
6. Add provider secrets to the deployment environment only; never commit them.
7. Test inbound message verification.
8. Test a payment/credit support conversation.
9. Test transaction ownership lookup.
10. Test media/image handling only after text support is stable.

## Security requirements
- Secrets are deployment environment variables only.
- Verify webhook signatures according to the provider's current specification.
- Reject replayed webhook events with event idempotency.
- Never trust a WhatsApp phone number as sufficient authorization for a customer's private transaction data.
- Resolve the PromptStudio user identity through the approved account-linking flow.

## Initial supported intents
- payment_issue
- credits_missing
- transaction_question
- generation_issue
- account_help

## Not enabled yet
This document does not claim that a WhatsApp webhook is live. Provider credentials and webhook configuration are still pending project-owner setup.

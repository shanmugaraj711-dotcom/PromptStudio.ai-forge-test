# PromptStudio.ai — Prelaunch Full Audit

Branch: prelaunch-full-audit-20260830

## Release checklist

- [x] Image → Prompt core flow
- [x] Reference Coding core flow
- [x] Multi-reference workflow
- [x] Reference file validation/detection
- [x] Prompt Builder
- [x] Pro plan and Creator Credits configuration
- [x] Authentication
- [x] Referral
- [x] Payments infrastructure
- [x] Admin authentication/security
- [ ] Reference Coding usage telemetry in Admin analytics
- [ ] Admin Reference Coding filters/details
- [x] Global route scroll restoration
- [ ] Full production smoke test
- [ ] WhatsApp Meta number authentication
- [ ] WhatsApp live inbound/outbound E2E test

## UX acceptance

Reference Coding should use the same product language as Reference Image: visible credits, clear reference upload, supported-format feedback before upload, progress state, obvious generated result, copy/share/download actions, mobile-friendly layout, and clear next-step guidance.

## Safety

- Do not execute uploaded applications.
- Validate extension, MIME/signature and size before upload.
- Treat renamed executable files according to the documented safe-reference policy.
- Do not expose customer file contents in Admin analytics.

## Deployment rule

No production deployment until code-side checks and smoke tests are green. Main remains the protected release branch while this audit is in progress.

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const formatInr = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const sendCreditPurchaseEmail = async ({ to, amountInr, credits, orderId, paymentId, paidAt, balance }) => {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.PROMPTSTUDIO_FROM_EMAIL || "").trim();
  if (!apiKey || !from || !to) {
    console.warn("PromptStudio purchase email skipped", {
      configured: Boolean(apiKey && from),
      hasRecipient: Boolean(to),
    });
    return { sent: false, skipped: true };
  }

  const safeTo = escapeHtml(to);
  const safeOrderId = escapeHtml(orderId);
  const safePaymentId = escapeHtml(paymentId);
  const safeCredits = Number(credits || 0);
  const safeBalance = Number(balance || 0);
  const paidDate = paidAt ? new Date(paidAt) : new Date();
  const formattedDate = Number.isNaN(paidDate.getTime()) ? "Just now" : paidDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fb;font-family:Inter,Arial,sans-serif;color:#111827;">
    <div style="max-width:620px;margin:32px auto;padding:0 16px;">
      <div style="background:#111827;border-radius:18px 18px 0 0;padding:26px 30px;color:#fff;">
        <div style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#60a5fa;">PROMPTSTUDIO AI</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;">Credit purchase confirmed ✓</h1>
        <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">Your PromptStudio credits have been added successfully.</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 18px 18px;padding:30px;">
        <p style="margin:0 0 22px;font-size:15px;">Thanks for your purchase. Here is your PromptStudio transaction receipt.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="padding:16px;background:#f8fafc;border-radius:12px;"><div style="font-size:11px;color:#64748b;text-transform:uppercase;">Amount paid</div><div style="margin-top:6px;font-size:21px;font-weight:800;">${formatInr(amountInr)}</div></div>
          <div style="padding:16px;background:#f8fafc;border-radius:12px;"><div style="font-size:11px;color:#64748b;text-transform:uppercase;">Credits added</div><div style="margin-top:6px;font-size:21px;font-weight:800;">${safeCredits}</div></div>
        </div>
        <div style="margin-top:18px;border-top:1px solid #e5e7eb;padding-top:18px;font-size:13px;line-height:1.8;color:#475569;">
          <div><strong style="color:#111827;">Email:</strong> ${safeTo}</div>
          <div><strong style="color:#111827;">Credits available:</strong> ${safeBalance}</div>
          <div><strong style="color:#111827;">Payment date:</strong> ${escapeHtml(formattedDate)}</div>
          <div><strong style="color:#111827;">Order ID:</strong> ${safeOrderId}</div>
          <div><strong style="color:#111827;">Payment ID:</strong> ${safePaymentId}</div>
        </div>
        <div style="margin-top:24px;padding:16px;border-radius:12px;background:#eef6ff;color:#1e3a8a;font-size:13px;">
          Credits never expire. You can use them for eligible PromptStudio features, including Reference Coding.
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">This is an automated payment confirmation from PromptStudio AI. Razorpay may also send its own payment receipt separately.</p>
      </div>
      <div style="padding:18px;text-align:center;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} PromptStudio AI</div>
    </div>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `promptstudio-credit-purchase-${orderId}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `PromptStudio AI — ${safeCredits} credits added (${formatInr(amountInr)})`,
      html,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || "PromptStudio purchase email could not be sent.");
    error.status = response.status;
    throw error;
  }

  return { sent: true, emailId: payload?.id || null };
};

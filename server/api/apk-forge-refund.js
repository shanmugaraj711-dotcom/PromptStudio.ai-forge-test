import { adminDb, json } from "./_firebaseAdmin.js";
import { requireFounderAdmin } from "./_adminSecurity.js";
import { isConfigured, razorpayRequest } from "./_razorpay.js";

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;
const now = () => new Date();
const refundRef = (db, id) => db.collection("apkForgeRequests").doc(id);
const fail = (status, code, message) => { const error = new Error(message); error.status = status; error.code = code; throw error; };

const processRefund = async (db, doc) => {
  const ref = doc.ref;
  const request = doc.data() || {};
  if (request.refundState !== "PENDING" || !request.paymentId) return { skipped: true };
  if (Number(request.refundAttemptCount || 0) >= MAX_ATTEMPTS) return { skipped: true, alert: true };
  const attempt = Number(request.refundAttemptCount || 0) + 1;
  await ref.set({ refundAttemptCount: attempt, refundLastAttemptAt: now(), updatedAt: now() }, { merge: true });
  try {
    const existingRefundId = request.refundProviderReference;
    if (existingRefundId) {
      await ref.set({ refundState: "COMPLETED", refundCompletedAt: now(), updatedAt: now() }, { merge: true });
      return { refunded: true, recovered: true };
    }
    const refund = await razorpayRequest(`/payments/${encodeURIComponent(request.paymentId)}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(request.amountPaise), notes: { forgeRequestId: request.forgeRequestId, reason: request.rejectionReason || "review_expired" } }),
    });
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const current = snap.data() || {};
      if (current.refundState === "COMPLETED") return;
      tx.update(ref, { refundState: "COMPLETED", refundProviderReference: refund.id, refundProviderStatus: refund.status || "processed", refundCompletedAt: now(), updatedAt: now() });
    });
    return { refunded: true };
  } catch (error) {
    await ref.set({ refundState: attempt >= MAX_ATTEMPTS ? "ADMIN_ALERT" : "PENDING", refundLastError: String(error?.message || "unknown").slice(0, 500), updatedAt: now() }, { merge: true });
    console.error("APK Forge refund attempt failed", { requestId: request.forgeRequestId, attempt, code: error?.code || "unknown", status: error?.status });
    return { refunded: false, error: true, alert: attempt >= MAX_ATTEMPTS };
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { code: "method_not_allowed", message: "Forge refunds accept POST requests only." });
  try {
    await requireFounderAdmin(req, { write: true });
    if (!isConfigured()) return json(res, 503, { code: "payment_not_configured", message: "Razorpay is not configured." });
    const db = adminDb();
    const pending = await db.collection("apkForgeRequests").where("refundState", "==", "PENDING").limit(BATCH_SIZE).get();
    const results = await Promise.all(pending.docs.map((doc) => processRefund(db, doc)));
    return json(res, 200, { ok: true, scanned: results.length, refunded: results.filter((r) => r.refunded).length, errors: results.filter((r) => r.error).length, alerts: results.filter((r) => r.alert).length, checkedAt: now().toISOString() });
  } catch (error) {
    console.error("APK Forge refund worker failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: error.code || "apk_forge_refund_failed", message: error.message || "Forge refund worker failed." });
  }
}

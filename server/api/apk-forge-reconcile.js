import { adminDb, json } from "./_firebaseAdmin.js";
import { isConfigured, razorpayRequest } from "./_razorpay.js";

const BATCH_SIZE = 50;
const internalAuthorized = (req) => {
  const configured = String(process.env.APK_FORGE_RECONCILE_SECRET || process.env.CRON_SECRET || "").trim();
  const suppliedHeader = String(req.headers["x-apk-forge-reconcile-secret"] || "").trim();
  const suppliedBearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  return Boolean(configured && ((suppliedHeader && suppliedHeader === configured) || (suppliedBearer && suppliedBearer === configured)));
};

const markCaptured = async (db, ref, payment) => db.runTransaction(async (tx) => {
  const snap = await tx.get(ref);
  if (!snap.exists) return false;
  const request = snap.data() || {};
  if (["PENDING_REVIEW", "APPROVED", "BUILDING", "VERIFYING", "READY"].includes(request.status)) return false;
  if (request.status !== "PAYMENT_PENDING") return false;
  if (request.razorpayOrderId !== payment.order_id) return false;
  if (Number(request.amountPaise) !== Number(payment.amount) || payment.status !== "captured") return false;
  tx.update(ref, { status: "PENDING_REVIEW", paymentId: payment.id, paidAt: new Date(), paymentReconciledAt: new Date(), updatedAt: new Date() });
  return true;
});

const reconcileRequest = async (db, doc) => {
  const request = doc.data() || {};
  if (!request.razorpayOrderId) return { scanned: true, captured: false };
  try {
    const order = await razorpayRequest(`/orders/${encodeURIComponent(request.razorpayOrderId)}`);
    if (order.status !== "paid") return { scanned: true, captured: false };
    const payments = await razorpayRequest(`/orders/${encodeURIComponent(request.razorpayOrderId)}/payments`);
    const payment = Array.isArray(payments?.items) ? payments.items.find((item) => item.status === "captured" && Number(item.amount) === Number(request.amountPaise)) : null;
    if (payment && await markCaptured(db, doc.ref, payment)) return { scanned: true, captured: true };
    return { scanned: true, captured: false };
  } catch (error) {
    console.error("APK Forge reconciliation item failed", { requestId: request.forgeRequestId, code: error?.code || "unknown", status: error?.status });
    return { scanned: true, captured: false, error: true };
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { code: "method_not_allowed", message: "Forge reconciliation accepts POST requests only." });
  if (!internalAuthorized(req)) return json(res, 401, { code: "unauthorized", message: "Reconciliation authentication failed." });
  if (!isConfigured()) return json(res, 503, { code: "payment_not_configured", message: "Razorpay is not configured." });
  try {
    const db = adminDb();
    const pending = await db.collection("apkForgeRequests").where("status", "==", "PAYMENT_PENDING").limit(BATCH_SIZE).get();
    const results = await Promise.all(pending.docs.map((doc) => reconcileRequest(db, doc)));
    return json(res, 200, { ok: true, scanned: results.length, captured: results.filter((item) => item.captured).length, errors: results.filter((item) => item.error).length, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("APK Forge reconciliation failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: "apk_forge_reconciliation_failed", message: error.message || "Reconciliation failed." });
  }
}

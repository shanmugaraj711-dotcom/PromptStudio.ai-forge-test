import { adminDb, json } from "./_firebaseAdmin.js";
import { isConfigured } from "./_razorpay.js";
import { getRuntimeProductConfig } from "./_productConfig.js";

const BATCH_SIZE = 50;
const internalAuthorized = (req) => { const expected = String(process.env.APK_FORGE_RECONCILE_SECRET || "").trim(); const supplied = String(req.headers["x-apk-forge-reconcile-secret"] || "").trim(); return Boolean(expected && supplied && expected === supplied); };
const now = () => new Date();
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { code: "method_not_allowed", message: "Forge expiry accepts POST requests only." });
  if (!internalAuthorized(req)) return json(res, 401, { code: "unauthorized", message: "Expiry authentication failed." });
  try {
    const db = adminDb();
    const config = await getRuntimeProductConfig(db);
    const hours = Number(config.pricing?.apkForge?.reviewExpiryHours || 72);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const snap = await db.collection("apkForgeRequests").where("status", "==", "PENDING_REVIEW").where("paidAt", "<=", cutoff).limit(BATCH_SIZE).get();
    let expired = 0;
    for (const doc of snap.docs) {
      const changed = await db.runTransaction(async (tx) => {
        const currentSnap = await tx.get(doc.ref);
        if (!currentSnap.exists) return false;
        const current = currentSnap.data() || {};
        if (current.status !== "PENDING_REVIEW") return false;
        tx.update(doc.ref, { status: "EXPIRED", expiredAt: now(), expiryReason: `No review within ${hours} hours.`, refundState: current.paymentId ? "PENDING" : "NOT_REQUIRED", refundRequestedAt: current.paymentId ? now() : null, updatedAt: now() });
        return true;
      });
      if (changed) expired += 1;
    }
    return json(res, 200, { ok: true, scanned: snap.size, expired, refundWorkerRequired: isConfigured(), checkedAt: now().toISOString() });
  } catch (error) {
    console.error("APK Forge expiry worker failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: "apk_forge_expiry_failed", message: error.message || "Forge expiry worker failed." });
  }
}

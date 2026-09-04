import { FieldValue } from "firebase-admin/firestore";
import { adminDb, json } from "./_firebaseAdmin.js";
import { razorpayRequest, verifyWebhookSignature } from "./_razorpay.js";

export const config = { api: { bodyParser: false } };
const readRawBody = async (req) => { if (typeof req.body === "string") return req.body; const chunks = []; for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return Buffer.concat(chunks).toString("utf8"); };
const fulfillCreditWebhook = async (orderId, paymentId) => { if (!orderId) return; const db = adminDb(); const ref = db.collection("paymentOrders").doc(orderId); await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if (!snap.exists || snap.data().fulfilled === true) return; const payment = snap.data(); const userRef = db.collection("users").doc(payment.uid); const userSnap = await tx.get(userRef); const user = userSnap.exists ? userSnap.data() : {}; tx.set(userRef, { credits: Math.max(Number(user.credits || 0), 0) + Math.max(Number(payment.credits || 0), 0), quotaVersion: FieldValue.increment(1) }, { merge: true }); tx.set(ref, { fulfilled: true, status: "paid", paymentId, paidAt: new Date() }, { merge: true }); }); };
const markCreditPaymentFailed = async (orderId, paymentId) => { if (!orderId) return; await adminDb().collection("paymentOrders").doc(orderId).set({ status: "failed", paymentId: paymentId || null, failedAt: new Date() }, { merge: true }); };
const fulfillForgeWebhook = async (orderId, paymentId) => {
  if (!orderId || !paymentId) return;
  const db = adminDb();
  const snapshot = await db.collection("apkForgeRequests").where("razorpayOrderId", "==", orderId).limit(1).get();
  if (snapshot.empty) return;
  const ref = snapshot.docs[0].ref;
  const order = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}`);
  if (order.status !== "paid" || Number(order.amount) !== Number(snapshot.docs[0].data()?.amountPaise) || order.currency !== snapshot.docs[0].data()?.currency) return;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const request = snap.data() || {};
    if (request.razorpayOrderId !== orderId || request.amountPaise !== order.amount) return;
    if (["PENDING_REVIEW", "APPROVED", "BUILDING", "VERIFYING", "READY"].includes(request.status)) return;
    if (request.status !== "PAYMENT_PENDING") return;
    tx.update(ref, { status: "PENDING_REVIEW", paymentId, paidAt: new Date(), paymentVerifiedAt: new Date(), paymentWebhookAt: new Date(), razorpayOrderStatus: order.status, updatedAt: new Date() });
  });
};
const updateSubscription = async (subscription, event) => { const subscriptionId = subscription?.id; if (!subscriptionId) return; const db = adminDb(); const ref = db.collection("paymentSubscriptions").doc(subscriptionId); const snap = await ref.get(); if (!snap.exists) return; const stored = snap.data(); const status = subscription.status || event.replace("subscription.", ""); const userRef = db.collection("users").doc(stored.uid); const active = ["active", "authenticated", "resumed"].includes(status); const ended = ["cancelled", "completed", "halted"].includes(status); await db.runTransaction(async (tx) => { if (ended) tx.set(userRef, { plan: "free", subscriptionStatus: status, quotaVersion: FieldValue.increment(1) }, { merge: true }); else if (active) tx.set(userRef, { plan: "pro", subscriptionStatus: status, subscriptionBilling: stored.billing, razorpaySubscriptionId: subscriptionId, quotaVersion: FieldValue.increment(1) }, { merge: true }); else tx.set(userRef, { subscriptionStatus: status, quotaVersion: FieldValue.increment(1) }, { merge: true }); tx.set(ref, { status, lastWebhookEvent: event, updatedAt: new Date() }, { merge: true }); }); };
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Method not allowed." });
  const rawBody = await readRawBody(req); const signature = req.headers["x-razorpay-signature"] || "";
  if (!signature || !verifyWebhookSignature(rawBody, signature)) return json(res, 400, { message: "Invalid webhook signature." });
  let payload;
  try { payload = JSON.parse(rawBody); } catch { return json(res, 400, { message: "Invalid webhook payload." }); }
  const event = payload.event || "";
  const eventId = req.headers["x-razorpay-event-id"] || `${event}:${payload?.payload?.payment?.entity?.id || payload?.payload?.subscription?.entity?.id || Date.now()}`;
  const db = adminDb();
  const eventRef = db.collection("paymentWebhookEvents").doc(String(eventId).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 150));
  try {
    const existing = await eventRef.get();
    if (existing.exists && existing.data()?.status === "processed") return json(res, 200, { ok: true, duplicate: true });
    await eventRef.set({ event, receivedAt: existing.exists ? existing.data()?.receivedAt || new Date() : new Date(), status: "processing", updatedAt: new Date() }, { merge: true });
    if (event === "payment.captured") {
      const payment = payload?.payload?.payment?.entity;
      if (payment?.order_id) {
        let isForge = false;
        try {
          const order = await razorpayRequest(`/orders/${encodeURIComponent(payment.order_id)}`);
          isForge = order?.notes?.type === "apk_forge_build";
        } catch (error) { console.error("Forge webhook order lookup failed", { code: error?.code || "unknown" }); throw error; }
        if (isForge) await fulfillForgeWebhook(payment.order_id, payment.id);
        else await fulfillCreditWebhook(payment.order_id, payment.id);
      }
    }
    if (event === "payment.failed") {
      const payment = payload?.payload?.payment?.entity;
      if (payment?.order_id) {
        let isForge = false;
        try { const order = await razorpayRequest(`/orders/${encodeURIComponent(payment.order_id)}`); isForge = order?.notes?.type === "apk_forge_build"; } catch (error) { console.error("Forge failed-payment lookup failed", { code: error?.code || "unknown" }); }
        if (!isForge) await markCreditPaymentFailed(payment.order_id, payment.id);
      }
    }
    if (event.startsWith("subscription.")) await updateSubscription(payload?.payload?.subscription?.entity, event);
    await eventRef.set({ status: "processed", processedAt: new Date(), updatedAt: new Date() }, { merge: true });
    return json(res, 200, { ok: true });
  } catch (error) {
    await eventRef.set({ status: "failed", lastError: String(error?.message || "unknown").slice(0, 500), failedAt: new Date(), updatedAt: new Date() }, { merge: true }).catch(() => {});
    console.error("Razorpay webhook failed", { code: error?.code || "unknown" });
    return json(res, 500, { message: "Webhook processing failed." });
  }
}

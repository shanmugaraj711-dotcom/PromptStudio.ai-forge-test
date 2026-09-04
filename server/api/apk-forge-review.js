import { adminDb, json } from "./_firebaseAdmin.js";
import { requireFounderAdmin } from "./_adminSecurity.js";
import { dispatchForgeBuild } from "./_forgeGitHub.js";
import { getRuntimeProductConfig } from "./_productConfig.js";
import { isConfigured, razorpayRequest } from "./_razorpay.js";

const ACTIVE = new Set(["PENDING_REVIEW"]);
const REFUND_STATES = new Set(["NOT_REQUIRED", "PENDING"]);
const BUILD_STATUSES = ["BUILDING", "VERIFYING", "READY", "BUILD_FAILED"];
const STABLE_FORGE_TEST_ORIGIN = "https://prompt-studio-ai-git-forge-apk-forge-prompt-studioai.vercel.app";
const now = () => new Date();
const requestRef = (db, id) => db.collection("apkForgeRequests").doc(id);
const slotDate = () => now().toISOString().slice(0, 10);
const serializeDate = (value) => value?.toDate?.()?.toISOString?.() || value || null;
const buildView = (doc) => {
  const data = doc.data() || {};
  return { id: doc.id, ...data, buildStartedAt: serializeDate(data.buildStartedAt), buildFinishedAt: serializeDate(data.buildFinishedAt), verifiedAt: serializeDate(data.verifiedAt), createdAt: serializeDate(data.createdAt), paidAt: serializeDate(data.paidAt) };
};
const fail = (status, code, message) => { const error = new Error(message); error.status = status; error.code = code; throw error; };
const buildIdFor = (id) => `forge_${String(id || "").replace(/[^A-Za-z0-9_-]/g, "-")}_${Date.now().toString(36)}`;

const verifyCapturedPayment = async (request) => {
  if (!isConfigured()) fail(503, "payment_not_configured", "Razorpay is not configured.");
  if (!request.paymentId || !request.razorpayOrderId) fail(409, "forge_payment_missing", "A verified Razorpay payment reference is required before approval.");
  const order = await razorpayRequest(`/orders/${encodeURIComponent(request.razorpayOrderId)}`);
  const expectedAmount = Number(request.amountPaise || Number(request.amountInr) * 100);
  if (order.id !== request.razorpayOrderId || order.currency !== String(request.currency || "INR") || Number(order.amount) !== expectedAmount || order.status !== "paid") fail(409, "forge_payment_not_verified", "Razorpay does not currently confirm this Forge request as paid.");
  const payments = await razorpayRequest(`/orders/${encodeURIComponent(request.razorpayOrderId)}/payments`);
  const payment = Array.isArray(payments?.items) ? payments.items.find((item) => item.id === request.paymentId) : null;
  if (!payment || payment.order_id !== request.razorpayOrderId || payment.status !== "captured" || Number(payment.amount) !== expectedAmount) fail(409, "forge_payment_not_verified", "The linked Razorpay payment is not a captured payment for this Forge order.");
  return { order, payment };
};

export default async function handler(req, res) {
  try {
    const actor = await requireFounderAdmin(req, { write: req.method !== "GET" });
    const db = adminDb();
    if (req.method === "GET") {
      const [pendingSnap, buildsSnap] = await Promise.all([
        db.collection("apkForgeRequests").where("status", "==", "PENDING_REVIEW").limit(100).get(),
        db.collection("apkForgeRequests").where("status", "in", BUILD_STATUSES).limit(100).get(),
      ]);
      const requests = pendingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      requests.sort((a, b) => {
        const left = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const right = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return left - right;
      });
      const builds = buildsSnap.docs.filter((doc) => Boolean(doc.data()?.buildId)).map(buildView).sort((a, b) => new Date(b.buildStartedAt || b.createdAt || 0) - new Date(a.buildStartedAt || a.createdAt || 0));
      return json(res, 200, { ok: true, requests, builds });
    }
    if (req.method !== "POST") return json(res, 405, { code: "method_not_allowed", message: "Forge review accepts GET and POST requests only." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const forgeRequestId = String(body.forgeRequestId || "").trim();
    const decision = String(body.decision || "").trim().toUpperCase();
    if (!forgeRequestId || !["APPROVE", "REJECT", "REBUILD_STABLE_TEST"].includes(decision)) return json(res, 400, { code: "invalid_review", message: "Forge request ID and a supported review decision are required." });
    const ref = requestRef(db, forgeRequestId);

    if (decision === "REJECT") {
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
        const request = snap.data() || {};
        if (!ACTIVE.has(request.status)) fail(409, "forge_review_conflict", `Forge request is already ${request.status}.`);
        if (!request.paymentId) fail(409, "forge_payment_missing", "A paid Forge request cannot be rejected without a payment reference.");
        const refundState = request.refundState || "NOT_REQUIRED";
        if (!REFUND_STATES.has(refundState)) fail(409, "forge_refund_conflict", "Forge refund is already being processed or completed.");
        const ts = now();
        tx.update(ref, { status: "REJECTED", rejectionReason: String(body.reason || "Rejected by founder review.").slice(0, 1000), reviewedAt: ts, reviewedBy: actor.uid, refundState: "PENDING", refundRequestedAt: ts, refundAttemptCount: Number(request.refundAttemptCount || 0), updatedAt: ts });
        return { status: "REJECTED", refundRequired: true };
      });
      return json(res, 200, { ok: true, forgeRequestId, ...result });
    }

    if (decision === "REBUILD_STABLE_TEST") {
      const currentSnap = await ref.get();
      if (!currentSnap.exists) return json(res, 404, { code: "forge_request_not_found", message: "Forge request was not found." });
      const currentRequest = currentSnap.data() || {};
      if (!["READY", "BUILD_FAILED"].includes(currentRequest.status)) return json(res, 409, { code: "forge_rebuild_conflict", message: `Stable test rebuild requires an already approved READY or BUILD_FAILED request; current status is ${currentRequest.status}.` });
      await verifyCapturedPayment(currentRequest);

      const config = await getRuntimeProductConfig(db);
      const forgeConfig = config.pricing?.apkForge || {};
      const dailyLimit = Math.max(1, Number(forgeConfig.dailyBuildLimit || 5));
      const buildDate = slotDate();
      const slotRef = db.collection("apkForgeBuildSlots").doc(buildDate);
      const buildId = buildIdFor(forgeRequestId);
      const approved = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
        const request = snap.data() || {};
        if (!["READY", "BUILD_FAILED"].includes(request.status)) fail(409, "forge_rebuild_conflict", `Forge request is already ${request.status}.`);
        const slotSnap = await tx.get(slotRef);
        const slot = slotSnap.exists ? (slotSnap.data() || {}) : {};
        const reserved = Number(slot.reservedCount || 0);
        if (reserved >= dailyLimit) fail(429, "forge_daily_build_limit", `The Forge daily build limit of ${dailyLimit} has been reached. Try again tomorrow.`);
        const ts = now();
        if (slotSnap.exists) tx.update(slotRef, { reservedCount: reserved + 1, updatedAt: ts });
        else tx.set(slotRef, { date: buildDate, reservedCount: 1, dailyLimit, createdAt: ts, updatedAt: ts });
        tx.update(ref, { status: "BUILDING", websiteUrl: STABLE_FORGE_TEST_ORIGIN, previousBuildId: request.buildId || null, previousWebsiteUrl: request.websiteUrl || null, buildId, buildDate, buildSlotReserved: true, buildDispatchStatus: "DISPATCH_PENDING", buildStartedAt: ts, rebuildReason: "Founder-approved stable Forge test rebuild using existing paid request.", rebuildApprovedAt: ts, rebuildApprovedBy: actor.uid, updatedAt: ts });
        return { ...request, buildId, websiteUrl: STABLE_FORGE_TEST_ORIGIN };
      });

      try {
        await dispatchForgeBuild({ forgeRequestId, buildId, appName: approved.appName || "PromptStudio AI", forgeWebOrigin: STABLE_FORGE_TEST_ORIGIN, packageId: approved.packageId || "in.promptstudio.ai", versionName: approved.versionName || "0.1.0", versionCode: approved.versionCode || "1" });
        await ref.set({ buildDispatchStatus: "DISPATCHED", buildDispatchedAt: now(), updatedAt: now() }, { merge: true });
        return json(res, 200, { ok: true, forgeRequestId, status: "BUILDING", buildId, buildDispatchStatus: "DISPATCHED", websiteUrl: STABLE_FORGE_TEST_ORIGIN, reusedPayment: true, reusedApproval: true });
      } catch (error) {
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          const slotSnap = await tx.get(slotRef);
          if (!snap.exists) return;
          const current = snap.data() || {};
          if (current.status !== "BUILDING" || current.buildId !== buildId) return;
          const slot = slotSnap.exists ? (slotSnap.data() || {}) : {};
          tx.update(ref, { status: current.previousBuildId ? "READY" : "BUILD_FAILED", websiteUrl: current.previousWebsiteUrl || STABLE_FORGE_TEST_ORIGIN, buildId: current.previousBuildId || null, buildDispatchStatus: "FAILED", buildDispatchError: String(error?.message || "Build dispatch failed.").slice(0, 500), buildDispatchFailedAt: now(), buildSlotReserved: false, updatedAt: now() });
          if (slotSnap.exists) tx.update(slotRef, { reservedCount: Math.max(0, Number(slot.reservedCount || 0) - 1), updatedAt: now() });
        });
        throw error;
      }
    }

    const currentSnap = await ref.get();
    if (!currentSnap.exists) return json(res, 404, { code: "forge_request_not_found", message: "Forge request was not found." });
    const currentRequest = currentSnap.data() || {};
    if (!ACTIVE.has(currentRequest.status)) return json(res, 409, { code: "forge_review_conflict", message: `Forge request is already ${currentRequest.status}.` });
    await verifyCapturedPayment(currentRequest);

    const config = await getRuntimeProductConfig(db);
    const forgeConfig = config.pricing?.apkForge || {};
    const dailyLimit = Math.max(1, Number(forgeConfig.dailyBuildLimit || 5));
    const buildDate = slotDate();
    const slotRef = db.collection("apkForgeBuildSlots").doc(buildDate);
    const buildId = buildIdFor(forgeRequestId);
    const approved = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
      const request = snap.data() || {};
      if (!ACTIVE.has(request.status)) fail(409, "forge_review_conflict", `Forge request is already ${request.status}.`);
      if (request.buildId && request.buildDispatchStatus !== "FAILED") fail(409, "forge_build_already_started", "This Forge request already has a build reservation.");
      const slotSnap = await tx.get(slotRef);
      const slot = slotSnap.exists ? (slotSnap.data() || {}) : {};
      const reserved = Number(slot.reservedCount || 0);
      if (reserved >= dailyLimit) fail(429, "forge_daily_build_limit", `The Forge daily build limit of ${dailyLimit} has been reached. Try again tomorrow.`);
      const ts = now();
      if (slotSnap.exists) tx.update(slotRef, { reservedCount: reserved + 1, updatedAt: ts });
      else tx.set(slotRef, { date: buildDate, reservedCount: 1, dailyLimit, createdAt: ts, updatedAt: ts });
      tx.update(ref, { status: "BUILDING", buildId, buildDate, buildSlotReserved: true, buildDispatchStatus: "DISPATCH_PENDING", buildStartedAt: ts, reviewedAt: ts, reviewedBy: actor.uid, updatedAt: ts });
      return { ...request, buildId };
    });

    try {
      await dispatchForgeBuild({ forgeRequestId, buildId, appName: approved.appName || "PromptStudio AI", forgeWebOrigin: approved.websiteUrl, packageId: approved.packageId || "in.promptstudio.ai", versionName: approved.versionName || "0.1.0", versionCode: approved.versionCode || "1" });
      await ref.set({ buildDispatchStatus: "DISPATCHED", buildDispatchedAt: now(), updatedAt: now() }, { merge: true });
      return json(res, 200, { ok: true, forgeRequestId, status: "BUILDING", buildId, buildDispatchStatus: "DISPATCHED" });
    } catch (error) {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const slotSnap = await tx.get(slotRef);
        if (!snap.exists) return;
        const current = snap.data() || {};
        if (current.status !== "BUILDING" || current.buildId !== buildId) return;
        const slot = slotSnap.exists ? (slotSnap.data() || {}) : {};
        tx.update(ref, { status: "APPROVED", buildDispatchStatus: "FAILED", buildDispatchError: String(error?.message || "Build dispatch failed.").slice(0, 500), buildDispatchFailedAt: now(), buildSlotReserved: false, updatedAt: now() });
        if (slotSnap.exists) tx.update(slotRef, { reservedCount: Math.max(0, Number(slot.reservedCount || 0) - 1), updatedAt: now() });
      });
      throw error;
    }
  } catch (error) {
    console.error("APK Forge review failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: error.code || "apk_forge_review_failed", message: error.message || "Forge review failed." });
  }
}

import { adminDb, json } from "./_firebaseAdmin.js";
import { requireFounderAdmin } from "./_adminSecurity.js";
import { dispatchForgeBuild } from "./_forgeGitHub.js";
import { getRuntimeProductConfig } from "./_productConfig.js";

const ACTIVE = new Set(["PENDING_REVIEW"]);
const REFUND_STATES = new Set(["NOT_REQUIRED", "PENDING"]);
const now = () => new Date();
const requestRef = (db, id) => db.collection("apkForgeRequests").doc(id);
const slotDate = () => now().toISOString().slice(0, 10);
const fail = (status, code, message) => { const error = new Error(message); error.status = status; error.code = code; throw error; };
const buildIdFor = (id) => `forge_${String(id || "").replace(/[^A-Za-z0-9_-]/g, "-")}_${Date.now().toString(36)}`;

export default async function handler(req, res) {
  try {
    const actor = await requireFounderAdmin(req, { write: req.method !== "GET" });
    const db = adminDb();
    if (req.method === "GET") {
      const snap = await db.collection("apkForgeRequests").where("status", "==", "PENDING_REVIEW").orderBy("createdAt", "asc").limit(100).get();
      return json(res, 200, { ok: true, requests: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
    }
    if (req.method !== "POST") return json(res, 405, { code: "method_not_allowed", message: "Forge review accepts GET and POST requests only." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const forgeRequestId = String(body.forgeRequestId || "").trim();
    const decision = String(body.decision || "").trim().toUpperCase();
    if (!forgeRequestId || !["APPROVE", "REJECT"].includes(decision)) return json(res, 400, { code: "invalid_review", message: "Forge request ID and APPROVE/REJECT decision are required." });
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

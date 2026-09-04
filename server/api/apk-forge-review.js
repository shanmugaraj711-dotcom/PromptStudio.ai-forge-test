import { adminDb, json } from "./_firebaseAdmin.js";
import { requireFounderAdmin } from "./_adminSecurity.js";
import { dispatchForgeBuild } from "./_forgeGitHub.js";

const ACTIVE = new Set(["PENDING_REVIEW"]);
const REFUND_STATES = new Set(["NOT_REQUIRED", "PENDING"]);
const now = () => new Date();
const requestRef = (db, id) => db.collection("apkForgeRequests").doc(id);
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

    const buildId = buildIdFor(forgeRequestId);
    const approved = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
      const request = snap.data() || {};
      if (!ACTIVE.has(request.status)) fail(409, "forge_review_conflict", `Forge request is already ${request.status}.`);
      if (request.buildId || request.buildDispatchStatus === "DISPATCHED") fail(409, "forge_build_already_started", "This Forge request already has a build reservation.");
      const ts = now();
      tx.update(ref, { status: "BUILDING", buildId, buildDispatchStatus: "DISPATCH_PENDING", buildStartedAt: ts, reviewedAt: ts, reviewedBy: actor.uid, updatedAt: ts });
      return { ...request, buildId };
    });

    try {
      await dispatchForgeBuild({ forgeRequestId, buildId, appName: approved.appName || "PromptStudio AI", forgeWebOrigin: approved.websiteUrl, packageId: approved.packageId || "in.promptstudio.ai", versionName: approved.versionName || "0.1.0", versionCode: approved.versionCode || "1" });
      await ref.set({ buildDispatchStatus: "DISPATCHED", buildDispatchedAt: now(), updatedAt: now() }, { merge: true });
      return json(res, 200, { ok: true, forgeRequestId, status: "BUILDING", buildId, buildDispatchStatus: "DISPATCHED" });
    } catch (error) {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const current = snap.data() || {};
        if (current.status !== "BUILDING" || current.buildId !== buildId) return;
        tx.update(ref, { status: "APPROVED", buildDispatchStatus: "FAILED", buildDispatchError: String(error?.message || "Build dispatch failed.").slice(0, 500), buildDispatchFailedAt: now(), updatedAt: now() });
      });
      throw error;
    }
  } catch (error) {
    console.error("APK Forge review failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: error.code || "apk_forge_review_failed", message: error.message || "Forge review failed." });
  }
}

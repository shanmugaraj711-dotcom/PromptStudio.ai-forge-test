import { adminDb, json, requireUser } from "./_firebaseAdmin.js";
import { listForgeArtifacts, listForgeBuildRuns } from "./_forgeGitHub.js";

const serializeDate = (value) => value?.toDate?.()?.toISOString?.() || value || null;
const requestRef = (db, id) => db.collection("apkForgeRequests").doc(id);
const fail = (status, code, message) => { const error = new Error(message); error.status = status; error.code = code; throw error; };

const reconcile = async (db, ref, request) => {
  if (!request.buildId || !["BUILDING", "VERIFYING"].includes(request.status)) return request;
  const runs = await listForgeBuildRuns({ forgeRequestId: ref.id, buildId: request.buildId });
  const run = runs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
  if (!run) return request;
  if (run.status !== "completed") {
    await ref.set({ githubRunId: run.id, githubRunStatus: run.status, githubRunUrl: run.html_url || null, updatedAt: new Date() }, { merge: true });
    return { ...request, githubRunId: run.id, githubRunStatus: run.status, githubRunUrl: run.html_url || null };
  }
  if (run.conclusion !== "success") {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const current = snap.data() || {};
      if (current.status !== "BUILDING" && current.status !== "VERIFYING") return;
      tx.update(ref, { status: "BUILD_FAILED", githubRunId: run.id, githubRunStatus: run.status, githubRunConclusion: run.conclusion, githubRunUrl: run.html_url || null, buildFinishedAt: new Date(), updatedAt: new Date() });
    });
    return { ...request, status: "BUILD_FAILED", githubRunId: run.id, githubRunStatus: run.status, githubRunConclusion: run.conclusion, githubRunUrl: run.html_url || null };
  }
  const artifacts = await listForgeArtifacts(run.id);
  const artifact = artifacts.find((item) => item?.name === `promptstudio-forge-${request.buildId}` && !item.expired);
  if (!artifact) fail(502, "forge_artifact_missing", "The Forge build completed but its APK artifact was not found.");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = snap.data() || {};
    if (current.status !== "BUILDING" && current.status !== "VERIFYING") return;
    tx.update(ref, { status: "READY", githubRunId: run.id, githubRunStatus: run.status, githubRunConclusion: run.conclusion, githubRunUrl: run.html_url || null, artifactId: artifact.id, artifactName: artifact.name, artifactSize: artifact.size_in_bytes || null, artifactExpired: Boolean(artifact.expired), artifactUrl: artifact.archive_download_url || null, buildFinishedAt: new Date(), verifiedAt: new Date(), updatedAt: new Date() });
  });
  return { ...request, status: "READY", githubRunId: run.id, githubRunStatus: run.status, githubRunConclusion: run.conclusion, githubRunUrl: run.html_url || null, artifactId: artifact.id, artifactName: artifact.name, artifactSize: artifact.size_in_bytes || null, artifactExpired: Boolean(artifact.expired) };
};

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { code: "method_not_allowed", message: "Forge build status accepts GET requests only." });
  try {
    const decoded = await requireUser(req);
    const id = String(req.query?.forgeRequestId || req.query?.id || "").trim();
    if (!id) return json(res, 400, { code: "forge_request_id_required", message: "Forge request ID is required." });
    const db = adminDb();
    const ref = requestRef(db, id);
    const snap = await ref.get();
    if (!snap.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
    const request = snap.data() || {};
    if (String(request.uid || "") !== decoded.uid) fail(403, "forge_request_forbidden", "You do not have access to this Forge request.");
    const current = await reconcile(db, ref, request);
    return json(res, 200, { ok: true, forgeRequestId: id, status: current.status, buildId: current.buildId || null, githubRunId: current.githubRunId || null, githubRunStatus: current.githubRunStatus || null, githubRunConclusion: current.githubRunConclusion || null, githubRunUrl: current.githubRunUrl || null, artifactId: current.artifactId || null, artifactName: current.artifactName || null, artifactSize: current.artifactSize || null, createdAt: serializeDate(current.createdAt), paidAt: serializeDate(current.paidAt), buildStartedAt: serializeDate(current.buildStartedAt), buildFinishedAt: serializeDate(current.buildFinishedAt), verifiedAt: serializeDate(current.verifiedAt) });
  } catch (error) {
    console.error("APK Forge build status failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: error.code || "apk_forge_build_status_failed", message: error.message || "Forge build status failed." });
  }
}

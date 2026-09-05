import { adminDb, json, requireUser } from "./_firebaseAdmin.js";
import { signedForgeApkUrl } from "./_forgeStorage.js";

const fail = (status, code, message) => { const error = new Error(message); error.status = status; error.code = code; throw error; };

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { code: "method_not_allowed", message: "Forge APK download accepts GET requests only." });
  try {
    const decoded = await requireUser(req);
    const forgeRequestId = String(req.query?.forgeRequestId || req.query?.id || "").trim();
    if (!forgeRequestId) fail(400, "forge_request_id_required", "Forge request ID is required.");
    const ref = adminDb().collection("apkForgeRequests").doc(forgeRequestId);
    const snapshot = await ref.get();
    if (!snapshot.exists) fail(404, "forge_request_not_found", "Forge request was not found.");
    const request = snapshot.data() || {};
    if (String(request.uid || "") !== decoded.uid) fail(403, "forge_download_forbidden", "You do not own this Forge build.");
    if (request.status !== "READY" || !request.apkStoragePath) fail(409, "forge_apk_not_ready", "This APK is not ready for download yet.");
    const url = await signedForgeApkUrl(request.apkStoragePath, forgeRequestId);
    return json(res, 200, { ok: true, url, expiresInSeconds: 600 });
  } catch (error) {
    console.error("APK Forge download failed", { code: error?.code || "unknown", status: error?.status });
    return json(res, error.status || 500, { code: error.code || "apk_forge_download_failed", message: error.message || "Unable to prepare the APK download." });
  }
}

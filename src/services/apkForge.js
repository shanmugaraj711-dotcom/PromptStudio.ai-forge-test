export class ApkForgeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApkForgeError";
    Object.assign(this, details);
  }
}

export const createForgeRequestId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `forge-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function createApkForgeBrief({ description, idToken, references = [], outputFormat, fetchImpl = fetch }) {
  if (!idToken) throw new ApkForgeError("Your session has expired. Please sign in again.", { code: "unauthenticated" });

  let response;
  try {
    response = await fetchImpl("/api/apk-forge", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ description, platform: "android", references, outputFormat }),
    });
  } catch {
    throw new ApkForgeError("We could not reach Forge. Please check your connection and try again.", { code: "network_error" });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApkForgeError(payload.message || "Forge could not prepare the Android build brief.", {
      code: payload.code,
    });
  }
  if (!payload.ok || !payload.forge?.implementation || !Array.isArray(payload.safeReferenceMetadata)) {
    throw new ApkForgeError("Forge returned an incomplete build handoff.", { code: "invalid_response" });
  }
  return payload;
}

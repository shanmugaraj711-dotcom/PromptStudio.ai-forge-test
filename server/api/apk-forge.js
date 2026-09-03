import { requireUser } from "./_firebaseAdmin.js";

const MAX_DESCRIPTION = 12000;
const MAX_REFERENCE_FILES = 8;
const MAX_REFERENCE_TEXT = 120000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const EXECUTABLE_EXTENSIONS = new Set([".exe", ".dll", ".msi", ".com", ".scr", ".bin"]);

const normalizeName = (value) => String(value || "reference").trim().slice(0, 180) || "reference";

const extensionOf = (name) => {
  const value = normalizeName(name).toLowerCase();
  const index = value.lastIndexOf(".");
  return index >= 0 ? value.slice(index) : "";
};

const looksExecutable = (file) => {
  const name = normalizeName(file?.name);
  const extension = extensionOf(name);
  const mime = String(file?.mimeType || file?.type || "").toLowerCase();
  const declaredKind = String(file?.detectedType || file?.kind || "").toLowerCase();
  const signature = String(file?.signature || "").toUpperCase();

  return (
    EXECUTABLE_EXTENSIONS.has(extension) ||
    mime.includes("application/x-msdownload") ||
    mime.includes("application/vnd.microsoft.portable-executable") ||
    declaredKind.includes("executable") ||
    declaredKind.includes("binary") ||
    signature === "MZ" ||
    signature.startsWith("PE")
  );
};

const sanitizeReference = (file) => {
  const size = Number(file?.size || file?.bytes || 0);
  const executable = looksExecutable(file);

  return {
    name: normalizeName(file?.name),
    size: Number.isFinite(size) && size >= 0 ? size : null,
    mimeType: String(file?.mimeType || file?.type || "unknown").slice(0, 160),
    detectedType: executable ? "executable_or_binary" : String(file?.detectedType || file?.kind || "unknown").slice(0, 80),
    executable,
    contentAccepted: !executable && typeof file?.content === "string" && file.content.length <= MAX_REFERENCE_TEXT,
  };
};

const buildBrief = ({ description, references, platform, outputFormat }) => {
  const executableReferences = references.filter((item) => item.executable);
  const safeReferences = references.map((item) =>
    `- ${item.name} | ${item.detectedType} | ${item.size ?? "unknown"} bytes | executable/binary=${item.executable}`
  ).join("\n");

  return {
    mode: "apk-forge",
    platform: platform === "android" ? "android" : "android",
    outputFormat: outputFormat || "build-ready-android-brief",
    intent: description,
    evidence: safeReferences,
    warnings: executableReferences.length
      ? ["One or more references appear to be executable/binary content. They were classified as reference evidence only and must never be executed."]
      : [],
    implementation: {
      appArchitecture: "Choose a maintainable Android architecture appropriate to the requirements; prefer Kotlin and Jetpack Compose unless evidence requires otherwise.",
      screens: "Derive screens and navigation from screenshots, documentation and the customer's stated intent.",
      behavior: "Preserve only behavior supported by evidence. Mark inferred behavior as an assumption.",
      accessibility: "Include semantics, touch targets, contrast, dynamic text and screen-reader support.",
      responsive: "Support common Android phone sizes and orientations where relevant.",
      acceptance: "Define testable acceptance criteria for every major screen and flow.",
    },
    handoff: "This response is a build specification/handoff. Android compilation must occur in an isolated build runner, never inside the production serverless runtime.",
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ code: "method_not_allowed", message: "APK Forge accepts POST requests only." });
    return;
  }

  const user = await requireUser(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const description = String(body.description || body.idea || "").trim();
  const platform = String(body.platform || "android").toLowerCase();
  const outputFormat = String(body.outputFormat || "build-ready-android-brief").slice(0, 80);
  const references = Array.isArray(body.references) ? body.references.slice(0, MAX_REFERENCE_FILES) : [];

  if (!description) {
    res.status(400).json({ code: "description_required", message: "Tell Forge what the app should do and what you want built." });
    return;
  }
  if (description.length > MAX_DESCRIPTION) {
    res.status(413).json({ code: "description_too_large", message: `Description must be ${MAX_DESCRIPTION} characters or less.` });
    return;
  }
  if (platform !== "android") {
    res.status(400).json({ code: "unsupported_platform", message: "APK Forge currently targets Android APK builds." });
    return;
  }

  const sanitized = references.map(sanitizeReference);
  const oversized = sanitized.find((file) => file.size !== null && file.size > MAX_FILE_BYTES);
  if (oversized) {
    res.status(413).json({ code: "reference_too_large", message: `${oversized.name} exceeds the 25 MB Forge reference limit.` });
    return;
  }

  const brief = buildBrief({ description, references: sanitized, platform, outputFormat });

  res.status(200).json({
    ok: true,
    userId: user.uid,
    forge: brief,
    referenceCount: sanitized.length,
    safeReferenceMetadata: sanitized,
  });
}

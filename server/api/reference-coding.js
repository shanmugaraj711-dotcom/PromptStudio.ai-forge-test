import { FieldValue } from "firebase-admin/firestore";
import { adminDb, requireUser } from "./_firebaseAdmin.js";
import generatePromptHandler from "./generate-prompt.js";

const REFERENCE_CODING_CREDIT_COST = 5;

const deductReferenceCodingCredits = async ({ db, uid, requestId }) => {
  const userRef = db.collection("users").doc(uid);
  const ledgerRef = userRef.collection("creditLedger").doc(requestId);
  return db.runTransaction(async (transaction) => {
    const [userSnap, ledgerSnap] = await Promise.all([transaction.get(userRef), transaction.get(ledgerRef)]);
    if (ledgerSnap.exists) {
      const existing = ledgerSnap.data();
      return { alreadyCharged: true, creditsRemaining: existing.creditsRemaining };
    }
    const currentCredits = Math.max(Number(userSnap.exists ? userSnap.data()?.credits || 0 : 0), 0);
    if (currentCredits < REFERENCE_CODING_CREDIT_COST) {
      const error = new Error(`Reference Coding requires ${REFERENCE_CODING_CREDIT_COST} credits. You have ${currentCredits}.`);
      error.status = 402;
      error.code = "insufficient_credits";
      throw error;
    }
    const creditsRemaining = currentCredits - REFERENCE_CODING_CREDIT_COST;
    transaction.set(userRef, { credits: creditsRemaining, quotaVersion: FieldValue.increment(1) }, { merge: true });
    transaction.set(ledgerRef, { amount: REFERENCE_CODING_CREDIT_COST, reason: "reference_coding_generation", status: "charged", creditsRemaining, createdAt: FieldValue.serverTimestamp() });
    return { alreadyCharged: false, creditsRemaining };
  });
};

const refundReferenceCodingCredits = async ({ db, uid, requestId }) => {
  const userRef = db.collection("users").doc(uid);
  const ledgerRef = userRef.collection("creditLedger").doc(requestId);
  return db.runTransaction(async (transaction) => {
    const [userSnap, ledgerSnap] = await Promise.all([transaction.get(userRef), transaction.get(ledgerRef)]);
    if (!ledgerSnap.exists || ledgerSnap.data().status !== "charged") return;
    const currentCredits = Math.max(Number(userSnap.exists ? userSnap.data()?.credits || 0 : 0), 0);
    const restoredCredits = currentCredits + REFERENCE_CODING_CREDIT_COST;
    transaction.set(userRef, { credits: restoredCredits, quotaVersion: FieldValue.increment(1) }, { merge: true });
    transaction.set(ledgerRef, { status: "refunded", refundedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
};

// Reference Coding uses the proven fast generation pipeline. The dedicated route
// normalizes coding references into the existing authenticated/quota-safe contract.
export default async function handler(req, res) {
  if (req.method !== "POST") return generatePromptHandler(req, res);

  const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
  const images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
  const files = Array.isArray(body.referenceFiles) ? body.referenceFiles : [];
  const user = await requireUser(req);

  const db = adminDb();
  let creditResult;
  try {
    creditResult = await deductReferenceCodingCredits({ db, uid: user.uid, requestId: body.requestId });
  } catch (error) {
    res.status(error.status || 500).json({ code: error.code || "credit_check_failed", message: error.message });
    return;
  }

  const fileContext = files.length
    ? `\n\nREFERENCE FILES (static context only; never execute):\n${files.map((file) => `- ${file.name || "reference"} | ${file.detectedType || file.kind || "unknown"}${file.content ? `\n${String(file.content).slice(0, 120000)}` : ""}`).join("\n")}`
    : "";

  const codingBrief = `\n\nPROMPTSTUDIO REFERENCE CODING MODE:\nAnalyze the supplied reference as an existing product/UI. Create a coding-ready implementation prompt for a coding AI. First understand the user's intention (recreate, improve UX, modernize, add functionality, fix a flow, or transform an existing product). Preserve important existing behavior. Describe visible layout, hierarchy, components, interaction clues, responsive behavior, accessibility, visual language, implementation constraints, and acceptance criteria. Do not invent hidden behavior or execute application files. Separate visible facts from assumptions. The output should be actionable for Cursor, Claude Code, Lovable, Replit, ChatGPT or another coding agent. Provide three useful perspectives: Faithful Recreation, UX Improvement, and Production Implementation.${fileContext}`;

  const normalizedIdea = `${typeof body.idea === "string" ? body.idea.trim() : ""}${codingBrief}`;
  req.body = {
    ...body,
    idea: normalizedIdea,
    category: "coding",
    aiModel: "chatgpt",
    referenceCoding: true,
    image: images[0] || undefined,
  };
  delete req.body.images;
  delete req.body.referenceFiles;

  let result;
  try {
    result = await generatePromptHandler(req, res);
  } catch (error) {
    if (!creditResult.alreadyCharged) {
      await refundReferenceCodingCredits({ db, uid: user.uid, requestId: body.requestId });
    }
    throw error;
  }
  if (res.statusCode !== 200 && !creditResult.alreadyCharged) {
    await refundReferenceCodingCredits({ db, uid: user.uid, requestId: body.requestId });
  }

  // Record telemetry only after the underlying generation endpoint has returned
  // success. No prompt/reference contents are stored in analytics.
  if (res.statusCode === 200 && body.requestId) {
    const eventRef = db.collection("referenceCodingEvents").doc(`${user.uid}_${body.requestId}`);
    await eventRef.set({
      event: "reference_coding_generation",
      uid: user.uid,
      requestId: body.requestId,
      referenceCount: files.length + (images.length ? 1 : 0),
      imageReferenceCount: images.length,
      fileReferenceCount: files.length,
      referenceKinds: files.map((file) => String(file.detectedType || file.kind || "unknown")).slice(0, 8),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection("users").doc(user.uid).collection("prompts").doc(body.requestId).set({
      referenceCoding: true,
      referenceCodingReferenceCount: files.length + (images.length ? 1 : 0),
      referenceCodingGeneratedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return result;
}
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, requireUser } from "./_firebaseAdmin.js";
import generatePromptHandler from "./generate-prompt.js";

const ALLOWED_OUTPUT_FORMATS = {
  notsure: "Choose the most sensible output format for this task yourself, and briefly explain why you chose it.",
  react: "Output format: React (JSX). Return complete, runnable component code.",
  html: "Output format: plain HTML + CSS. Return complete, runnable markup and styles.",
  vue: "Output format: Vue (Single File Component). Return complete, runnable component code.",
  fullstack: "Output format: full-stack. Include both frontend UI code and any backend/API code needed.",
};

const ALLOWED_TARGET_AIS = new Set(["any", "cursor", "claude-code", "chatgpt", "gemini", "copilot", "lovable", "replit", "v0", "windsurf", "bolt", "cline"]);

const REFERENCE_CODING_CREDIT_COST = 5;

const deductReferenceCodingCredits = async ({ db, uid, requestId }) => {
  const userRef = db.collection("users").doc(uid);
  const ledgerRef = userRef.collection("creditLedger").doc(requestId);
  return db.runTransaction(async (transaction) => {
    const [userSnap, ledgerSnap] = await Promise.all([transaction.get(userRef), transaction.get(ledgerRef)]);
    if (ledgerSnap.exists) {
      const existing = ledgerSnap.data();

      return {
        alreadyCharged: existing.status === "charged",
        refundRequired: existing.status === "charged",
        creditsRemaining: existing.creditsRemaining
      };
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
    return {
      alreadyCharged: false,
      refundRequired: true,
      creditsRemaining
    };
  });
};

const isTransientFirestoreError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code.includes("deadline") ||
    code.includes("aborted") ||
    code.includes("unavailable") ||
    code.includes("resource-exhausted") ||
    message.includes("deadline exceeded") ||
    message.includes("unavailable") ||
    message.includes("aborted") ||
    message.includes("resource exhausted")
  );
};

const refundReferenceCodingCreditsOnce = async ({ db, uid, requestId }) => {
  const userRef = db.collection("users").doc(uid);
  const ledgerRef = userRef.collection("creditLedger").doc(requestId);

  return db.runTransaction(async (transaction) => {
    const [userSnap, ledgerSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(ledgerRef)
    ]);

    if (!ledgerSnap.exists) {
      return {
        refundStatus: "not_required",
        creditsRemaining: Math.max(
          Number(userSnap.exists ? userSnap.data()?.credits || 0 : 0),
          0
        )
      };
    }

    const ledger = ledgerSnap.data();

    if (ledger.status !== "charged") {
      return {
        refundStatus: ledger.status === "refunded"
          ? "confirmed"
          : "not_required",
        creditsRemaining: Math.max(
          Number(userSnap.exists ? userSnap.data()?.credits || 0 : 0),
          0
        )
      };
    }

    const currentCredits = Math.max(
      Number(userSnap.exists ? userSnap.data()?.credits || 0 : 0),
      0
    );

    const restoredCredits =
      currentCredits + REFERENCE_CODING_CREDIT_COST;

    transaction.set(
      userRef,
      {
        credits: restoredCredits,
        quotaVersion: FieldValue.increment(1)
      },
      { merge: true }
    );

    transaction.set(
      ledgerRef,
      {
        status: "refunded",
        refundedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      refundStatus: "confirmed",
      creditsRemaining: restoredCredits
    };
  });
};

const shouldRefundAfterGenerationResponse = async ({ db, uid, requestId, statusCode }) => {
  if (statusCode !== 409) return true;

  const requestRef = db
    .collection("users")
    .doc(uid)
    .collection("generationRequests")
    .doc(requestId);

  const snapshot = await requestRef.get();
  if (!snapshot.exists) return true;

  const status = snapshot.data()?.status;

  // A duplicate request can receive 409 while the original generation is
  // still reserved. Do not refund the original charge in that case.
  if (status === "reserved" || status === "succeeded") return false;

  return true;
};

const refundReferenceCodingCredits = async ({ db, uid, requestId }) => {
  const delays = [0, 150, 400];
  let lastError;

  for (const delay of delays) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      return await refundReferenceCodingCreditsOnce({
        db,
        uid,
        requestId
      });
    } catch (error) {
      lastError = error;

      if (!isTransientFirestoreError(error)) {
        throw error;
      }

      console.warn("Reference Coding refund attempt failed", {
        requestId,
        code: error?.code || "unknown"
      });
    }
  }

  console.error("Reference Coding refund could not be confirmed", {
    requestId,
    code: lastError?.code || "unknown"
  });

  return {
    refundStatus: "pending",
    creditsRemaining: null
  };
};

// Reference Coding uses the proven fast generation pipeline. The dedicated route
// normalizes coding references into the existing authenticated/quota-safe contract.
export default async function handler(req, res) {
  if (req.method !== "POST") return generatePromptHandler(req, res);

  const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
  const images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
  const files = Array.isArray(body.referenceFiles) ? body.referenceFiles : [];
  const outputFormat = ALLOWED_OUTPUT_FORMATS[body.outputFormat] ? body.outputFormat : "notsure";
  const targetAI = ALLOWED_TARGET_AIS.has(body.targetAI) ? body.targetAI : "any";
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

  const outputInstruction = `\n\n${ALLOWED_OUTPUT_FORMATS[outputFormat]} Do not ask the user clarifying questions — make reasonable assumptions for anything unspecified and note them briefly as code comments.`;
  const codingBrief = `\n\nPROMPTSTUDIO REFERENCE CODING MODE:\nAnalyze the supplied reference as an existing product/UI. Create a coding-ready implementation prompt for a coding AI. First understand the user's intention (recreate, improve UX, modernize, add functionality, fix a flow, or transform an existing product). Preserve important existing behavior. Describe visible layout, hierarchy, components, interaction clues, responsive behavior, accessibility, visual language, implementation constraints, and acceptance criteria. Do not invent hidden behavior or execute application files. Separate visible facts from assumptions. The output should be actionable for Cursor, Claude Code, Lovable, Replit, ChatGPT or another coding agent. Provide three useful perspectives: Faithful Recreation, UX Improvement, and Production Implementation.${outputInstruction}${fileContext}`;

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
    if (
      creditResult.refundRequired &&
      await shouldRefundAfterGenerationResponse({
        db,
        uid: user.uid,
        requestId: body.requestId,
        statusCode: Number(error?.status || 500)
      })
    ) {
      const refund = await refundReferenceCodingCredits({
        db,
        uid: user.uid,
        requestId: body.requestId
      });

      if (refund.refundStatus !== "confirmed") {
        console.error("Reference Coding refund pending after handler failure", {
          requestId: body.requestId,
          statusCode: Number(error?.status || 500)
        });
      }
    }

    throw error;
  }

  if (
    res.statusCode !== 200 &&
    creditResult.refundRequired &&
    await shouldRefundAfterGenerationResponse({
      db,
      uid: user.uid,
      requestId: body.requestId,
      statusCode: res.statusCode
    })
  ) {
    const refund = await refundReferenceCodingCredits({
      db,
      uid: user.uid,
      requestId: body.requestId
    });

    if (refund.refundStatus !== "confirmed") {
      console.error("Reference Coding refund pending after non-200 response", {
        requestId: body.requestId,
        statusCode: res.statusCode
      });
    }
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
      outputFormat,
      targetAI,
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
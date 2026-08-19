import { FieldValue } from "firebase-admin/firestore";
import { adminDb, json, requireUser } from "./_firebaseAdmin.js";

const DEFAULT_CONFIG = { enabled: true, referrerCredits: 5, refereeCredits: 5, rewardOn: "signup" };
const CODE_RE = /^[A-Z0-9]{8}$/;
const normalizeCode = (value) => String(value || "").trim().toUpperCase();
const makeCode = (uid) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = 0;
  for (const ch of uid) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i += 1) { seed = (seed * 1664525 + 1013904223) >>> 0; out += alphabet[seed % alphabet.length]; }
  return out;
};
const getConfig = async (db) => {
  const snap = await db.collection("system").doc("referrals").get();
  const data = snap.exists ? snap.data() : {};
  return {
    enabled: data.enabled !== false,
    referrerCredits: Math.max(0, Math.min(1000, Number(data.referrerCredits ?? DEFAULT_CONFIG.referrerCredits))),
    refereeCredits: Math.max(0, Math.min(1000, Number(data.refereeCredits ?? DEFAULT_CONFIG.refereeCredits))),
    rewardOn: "signup",
  };
};

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return json(res, 405, { message: "Method not allowed." });
  try {
    const user = await requireUser(req);
    const db = adminDb();
    if (req.method === "GET") {
      const profileRef = db.collection("users").doc(user.uid);
      const profileSnap = await profileRef.get();
      const profile = profileSnap.exists ? profileSnap.data() : {};
      let code = profile.referralCode;
      if (!code || !CODE_RE.test(code)) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const candidate = makeCode(`${user.uid}:${attempt}`);
          const codeRef = db.collection("referralCodes").doc(candidate);
          const existing = await codeRef.get();
          if (!existing.exists || existing.data()?.uid === user.uid) { code = candidate; break; }
        }
        if (!code) throw new Error("Could not create a referral code.");
        await db.runTransaction(async (tx) => {
          const codeRef = db.collection("referralCodes").doc(code);
          const existing = await tx.get(codeRef);
          if (existing.exists && existing.data()?.uid !== user.uid) throw new Error("Referral code collision.");
          tx.set(codeRef, { uid: user.uid, createdAt: FieldValue.serverTimestamp() }, { merge: true });
          tx.set(profileRef, { referralCode: code, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        });
      }
      const referralsSnap = await db.collection("referrals").where("referrerUid", "==", user.uid).get();
      const referrals = referralsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { code, enabled: (await getConfig(db)).enabled, referrals: referrals.map((r) => ({ status: r.status || "completed", createdAt: r.createdAt || null })) });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const code = normalizeCode(body.code);
    if (!CODE_RE.test(code)) return json(res, 400, { message: "Invalid referral code." });
    const config = await getConfig(db);
    if (!config.enabled) return json(res, 409, { message: "Referral rewards are currently disabled." });
    const codeSnap = await db.collection("referralCodes").doc(code).get();
    if (!codeSnap.exists) return json(res, 404, { message: "Referral code not found." });
    const referrerUid = codeSnap.data()?.uid;
    if (!referrerUid || referrerUid === user.uid) return json(res, 400, { message: "You cannot use your own referral code." });
    const referralId = `${referrerUid}_${user.uid}`;
    const referralRef = db.collection("referrals").doc(referralId);
    const referrerRef = db.collection("users").doc(referrerUid);
    const refereeRef = db.collection("users").doc(user.uid);
    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(referralRef);
      if (existing.exists) return { alreadyRewarded: true, referral: existing.data() };
      const [referrerSnap, refereeSnap] = await Promise.all([tx.get(referrerRef), tx.get(refereeRef)]);
      if (!referrerSnap.exists) throw new Error("Referrer account not found.");
      const referee = refereeSnap.exists ? refereeSnap.data() : {};
      if (referee.referredBy || referee.referralRewardedAt) return { alreadyRewarded: true, referral: { status: "already_attributed" } };
      const referrer = referrerSnap.data() || {};
      const now = FieldValue.serverTimestamp();
      const referrerCredits = Math.max(0, Number(referrer.credits || 0)) + config.referrerCredits;
      const refereeCredits = Math.max(0, Number(referee.credits || 0)) + config.refereeCredits;
      tx.set(referrerRef, { credits: referrerCredits, referralCreditsEarned: Math.max(0, Number(referrer.referralCreditsEarned || 0)) + config.referrerCredits, updatedAt: now }, { merge: true });
      tx.set(refereeRef, { credits: refereeCredits, referredBy: referrerUid, referralRewardedAt: now, referralRewardCredits: config.refereeCredits, updatedAt: now }, { merge: true });
      tx.set(referralRef, { referrerUid, refereeUid: user.uid, code, status: "completed", referrerReward: config.referrerCredits, refereeReward: config.refereeCredits, createdAt: now, completedAt: now });
      return { alreadyRewarded: false, referral: { status: "completed", referrerReward: config.referrerCredits, refereeReward: config.refereeCredits } };
    });
    return json(res, 200, { ok: true, ...result, message: result.alreadyRewarded ? "Referral already applied." : `Referral applied. You received ${config.refereeCredits} bonus credits.` });
  } catch (error) {
    console.error("Referral API error", { message: error?.message });
    return json(res, error.status || 500, { message: error.message || "Referral service unavailable." });
  }
}

import { adminAuth, adminDb, json } from "./_firebaseAdmin.js";
import { requireFounderAdmin } from "./_adminSecurity.js";
import { getRuntimeProductConfig, saveRuntimeProductConfig, writeConfigAudit } from "./_productConfig.js";

const count = async (query) => (await query.count().get()).data().count;
const money = (value) => Math.round(Number(value || 0) * 100) / 100;
const now = () => new Date();

const health = async (db) => { const config = await getRuntimeProductConfig(db); return { ok: true, checkedAt: now().toISOString(), firebaseAdmin: true, gemini: Boolean(process.env.GEMINI_API_KEY), razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET), razorpayPlans: Boolean(process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID && process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID), razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), paymentMode: config.monetization.paymentMode, plans: { free: config.plans.free, pro: config.plans.pro }, creditPricing: config.pricing.creditPacks, runtimeConfig: (await db.collection("systemConfig").doc("product").get()).exists }; };

const analytics = async (db) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [users, newUsers, prompts, imagePrompts, orders, paidOrders, failedPayments, subscriptions, activeSubscriptions, feedback, support] = await Promise.all([count(db.collection("users")), count(db.collection("users").where("createdAt", ">=", since)), count(db.collectionGroup("prompts")), count(db.collectionGroup("prompts").where("hasReferenceImage", "==", true)), count(db.collection("paymentOrders")), db.collection("paymentOrders").where("fulfilled", "==", true).get(), count(db.collection("paymentOrders").where("status", "==", "failed")), count(db.collection("paymentSubscriptions")), count(db.collection("paymentSubscriptions").where("status", "in", ["active", "authenticated", "resumed"])), count(db.collection("feedback")), count(db.collection("supportMessages"))]);
  const revenue = paidOrders.docs.reduce((sum, doc) => sum + Number(doc.data().amountInr || 0), 0);
  const paidCustomerUids = new Set(paidOrders.docs.map((doc) => doc.data().uid).filter(Boolean));
  const paidCustomers = paidCustomerUids.size;
  const freeToPaidConversionPercent = users > 0 ? money((paidCustomers / users) * 100) : 0;
  return { ok: true, checkedAt: now().toISOString(), users, newUsers, promptsGenerated: prompts, imageToPromptUsage: imagePrompts, creditsPurchased: paidOrders.docs.reduce((sum, doc) => sum + Number(doc.data().credits || 0), 0), creditOrders: orders, paidCustomers, freeToPaidConversionPercent, proSubscribers: activeSubscriptions, subscriptions, revenueInr: money(revenue), failedPayments, feedback, supportMessages: support };
};

const mapDocs = (snap) => snap.docs.map((doc) => { const data = doc.data() || {}; return { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null, updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null }; });
const inbox = async (db) => { const [supportSnap, feedbackSnap] = await Promise.all([db.collection("supportMessages").orderBy("createdAt", "desc").limit(50).get(), db.collection("feedback").orderBy("createdAt", "desc").limit(20).get()]); return { ok: true, support: mapDocs(supportSnap), feedback: mapDocs(feedbackSnap) }; };

const referralConfig = async (req, res, db, actor) => {
  const ref = db.collection("system").doc("referrals");
  if (req.method === "GET") {
    const snap = await ref.get(); const data = snap.exists ? snap.data() : {};
    const config = { enabled: data.enabled !== false, referrerCredits: Math.max(0, Math.min(1000, Number(data.referrerCredits ?? 5))), refereeCredits: Math.max(0, Math.min(1000, Number(data.refereeCredits ?? 5))), rewardOn: "signup" };
    const referrals = await db.collection("referrals").orderBy("createdAt", "desc").limit(100).get();
    return json(res, 200, { config, referrals: mapDocs(referrals) });
  }
  if (req.method !== "PUT") return json(res, 405, { message: "Method not allowed." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const referrerCredits = Number(body.referrerCredits); const refereeCredits = Number(body.refereeCredits);
  if (!Number.isInteger(referrerCredits) || referrerCredits < 0 || referrerCredits > 1000 || !Number.isInteger(refereeCredits) || refereeCredits < 0 || refereeCredits > 1000) return json(res, 400, { message: "Referral rewards must be whole numbers between 0 and 1,000 credits." });
  const config = { enabled: body.enabled !== false, referrerCredits, refereeCredits, rewardOn: "signup", updatedAt: now(), updatedBy: actor.uid };
  await ref.set(config, { merge: true });
  await db.collection("adminAuditLogs").add({ actorUid: actor.uid, action: "updateReferralRewards", targetUid: null, details: { enabled: config.enabled, referrerCredits, refereeCredits, rewardOn: "signup" }, createdAt: now() });
  return json(res, 200, { ok: true, config });
};

const userManagement = async (req, res, db, actor) => {
  if (req.method === "GET") { const snap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get(); return json(res, 200, { users: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) }); }
  if (req.method !== "POST") return json(res, 405, { message: "Method not allowed." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { action, uid, credits, plan, trialUntil, note, discountPercent, discountUntil } = body;
  if (!uid || !action) return json(res, 400, { message: "uid and action are required." });
  if (uid === actor.uid && ["suspend", "removeCredits", "setPlan", "setDiscount"].includes(action)) return json(res, 400, { message: "Founder account cannot be modified by this action." });
  const ref = db.collection("users").doc(uid); const snap = await ref.get(); if (!snap.exists) return json(res, 404, { message: "User profile not found." });
  const current = snap.data() || {}; const amount = Number(credits || 0); const update = { updatedAt: now(), founderActionBy: actor.uid };
  if (["grantCredits", "removeCredits"].includes(action) && (!Number.isInteger(amount) || amount <= 0 || amount > 100000)) return json(res, 400, { message: "Credits must be a positive integer up to 100,000." });
  if (action === "grantCredits") update.credits = Math.max(Number(current.credits || 0), 0) + amount;
  if (action === "removeCredits") update.credits = Math.max(0, Number(current.credits || 0) - amount);
  if (action === "setPlan") { if (!["free", "pro"].includes(String(plan))) return json(res, 400, { message: "Plan must be free or pro." }); update.plan = String(plan); }
  if (action === "setTrial") { if (trialUntil && Number.isNaN(Date.parse(trialUntil))) return json(res, 400, { message: "Invalid trial expiry." }); update.plan = "pro"; update.trialUntil = trialUntil || null; update.subscriptionStatus = trialUntil ? "founder_trial" : null; }
  if (action === "setDiscount") { const pct = Number(discountPercent || 0); if (!Number.isInteger(pct) || pct < 0 || pct > 90) return json(res, 400, { message: "Discount must be between 0% and 90%." }); if (discountUntil && Number.isNaN(Date.parse(discountUntil))) return json(res, 400, { message: "Invalid discount expiry." }); update.founderDiscountPercent = pct; update.founderDiscountUntil = discountUntil || null; }
  if (action === "suspend") update.suspended = true;
  if (action === "unsuspend") update.suspended = false;
  if (action === "resetQuota") { update.promptsToday = 0; update.lastPromptDate = null; update.imageAnalysesToday = 0; update.lastImageAnalysisDate = null; update.imageAnalysesThisMonth = 0; update.lastImageAnalysisMonth = null; update.quotaVersion = Number(current.quotaVersion || 0) + 1; }
  if (action === "note") update.founderNote = String(note || "").slice(0, 2000);
  if (!Object.keys(update).some((key) => !["updatedAt", "founderActionBy"].includes(key))) return json(res, 400, { message: "Unsupported action." });
  await ref.set(update, { merge: true });
  await db.collection("adminAuditLogs").add({ actorUid: actor.uid, action, targetUid: uid, details: { credits: amount || null, plan: plan || null, trialUntil: trialUntil || null, discountPercent: discountPercent ?? null, discountUntil: discountUntil || null, note: String(note || "").slice(0, 2000) }, createdAt: now() });
  return json(res, 200, { ok: true, message: "User updated successfully." });
};

const coupons = async (req, res, db, actor) => {
  if (req.method === "GET") { const snap = await db.collection("coupons").orderBy("createdAt", "desc").limit(100).get(); return json(res, 200, { coupons: mapDocs(snap) }); }
  if (req.method !== "POST") return json(res, 405, { message: "Method not allowed." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40); const type = body.type === "credits" ? "credits" : "percent"; const value = Number(body.value || 0); const maxUses = Number(body.maxUses || 0);
  if (!code) return json(res, 400, { message: "Coupon code required." });
  if (!Number.isInteger(value) || value <= 0 || (type === "percent" && value > 90) || (type === "credits" && value > 100000)) return json(res, 400, { message: "Invalid coupon value." });
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000) return json(res, 400, { message: "Usage limit must be between 1 and 100,000." });
  if (body.expiresAt && Number.isNaN(Date.parse(body.expiresAt))) return json(res, 400, { message: "Invalid coupon expiry." });
  const ref = db.collection("coupons").doc(code); if ((await ref.get()).exists) return json(res, 409, { message: "Coupon code already exists." });
  const data = { code, type, value, maxUses, usedCount: 0, expiresAt: body.expiresAt || null, active: body.active !== false, createdAt: now(), createdBy: actor.uid }; await ref.set(data); await db.collection("adminAuditLogs").add({ actorUid: actor.uid, action: "createCoupon", targetUid: null, details: data, createdAt: now() }); return json(res, 200, { ok: true, coupon: data });
};

const support = async (req, res, db, actor) => {
  if (req.method === "GET") { const snap = await db.collection("supportMessages").orderBy("createdAt", "desc").limit(100).get(); return json(res, 200, { messages: mapDocs(snap) }); }
  if (req.method !== "POST") return json(res, 405, { message: "Method not allowed." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); const id = String(body.id || "").trim(); const reply = String(body.reply || "").trim().slice(0, 5000);
  if (!id || !reply) return json(res, 400, { message: "Message and reply required." });
  const ref = db.collection("supportMessages").doc(id); if (!(await ref.get()).exists) return json(res, 404, { message: "Support message not found." });
  await ref.set({ adminReply: reply, status: String(body.status || "replied"), updatedAt: now(), repliedBy: actor.uid }, { merge: true }); await db.collection("adminAuditLogs").add({ actorUid: actor.uid, action: "replySupport", targetUid: null, details: { supportId: id }, createdAt: now() }); return json(res, 200, { ok: true, message: "Reply saved." });
};

export default async function handler(req, res) {
  const action = String(req.query?.action || req.body?.action || "health");
  try {
    const writeAction = ["config", "users", "support", "coupons", "referrals"].includes(action) && req.method !== "GET"; const actor = await requireFounderAdmin(req, { write: writeAction && action === "config" }); const db = adminDb();
    if (req.method === "GET" && action === "health") { adminAuth(); return json(res, 200, await health(db)); }
    if (req.method === "GET" && action === "analytics") return json(res, 200, await analytics(db));
    if (req.method === "GET" && action === "config") return json(res, 200, { config: await getRuntimeProductConfig(db) });
    if (req.method === "GET" && action === "inbox") return json(res, 200, await inbox(db));
    if (["users", "user-management"].includes(action)) return await userManagement(req, res, db, actor);
    if (["support", "support-inbox"].includes(action)) return await support(req, res, db, actor);
    if (["coupons", "coupon"].includes(action)) return await coupons(req, res, db, actor);
    if (["referrals", "referral-rewards"].includes(action)) return await referralConfig(req, res, db, actor);
    if (req.method === "PUT" && action === "config") { const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); if (!body.config || typeof body.config !== "object") return json(res, 400, { message: "A product configuration object is required." }); const before = await getRuntimeProductConfig(db); const after = await saveRuntimeProductConfig({ db, config: body.config, actor: actor.uid }); await writeConfigAudit({ db, actor, before, after, requestId: body.requestId }); return json(res, 200, { ok: true, config: after }); }
    return json(res, 405, { message: "Unsupported admin operation." });
  } catch (error) { console.error("Founder admin operation failed", { action, code: error?.code || "unknown" }); return json(res, error?.status || 500, { message: error?.message || "Founder admin operation failed." }); }
}

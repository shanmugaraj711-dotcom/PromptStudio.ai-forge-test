import { adminDb, json, requireUser } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Method not allowed." });
  try {
    const decoded = await requireUser(req);
    const message = String(req.body?.message || "").trim();
    const page = String(req.body?.page || "").trim().slice(0, 200);
    if (message.length < 3) return json(res, 400, { message: "Message is too short." });
    if (message.length > 2000) return json(res, 400, { message: "Message is too long." });

    const db = adminDb();
    const ref = await db.collection("supportMessages").add({
      uid: decoded.uid,
      email: decoded.email || null,
      message,
      page,
      status: "new",
      createdAt: new Date(),
    });
    return json(res, 200, { ok: true, id: ref.id });
  } catch (error) {
    console.error("Support message failed", { code: error?.code || "unknown" });
    return json(res, error?.status || 500, { message: "Could not send your support message." });
  }
}

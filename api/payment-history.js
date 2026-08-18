import { adminDb, json, requireUser } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { message: "Method not allowed." });
  try {
    const decoded = await requireUser(req);
    const snapshot = await adminDb().collection("paymentOrders").where("uid", "==", decoded.uid).get();
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        orderId: data.razorpayOrderId || doc.id,
        paymentId: data.paymentId || null,
        amountInr: Number(data.amountInr || 0),
        credits: Number(data.credits || 0),
        packId: data.packId || "credit_topup",
        status: data.status || (data.fulfilled ? "paid" : "pending"),
        fulfilled: data.fulfilled === true,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        paidAt: data.paidAt?.toDate?.()?.toISOString?.() || null,
      };
    }).sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
    return json(res, 200, { transactions });
  } catch (error) {
    console.error("Payment history failed", { code: error?.code || "unknown" });
    return json(res, error.status || 500, { message: error.message || "Unable to load payment history." });
  }
}

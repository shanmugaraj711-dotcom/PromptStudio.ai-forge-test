import { getAdminAuth, getAdminDb } from './_firebaseAdmin.js';

const json = (res, status, body) => { res.status(status).json(body); };
const now = () => new Date().toISOString();

async function requireAdmin(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new Error('Authentication required.');
  const token = await getAdminAuth().verifyIdToken(header.slice(7), true);
  if (token.admin !== true) throw new Error('Founder admin access required.');
  return token;
}

export default async function handler(req, res) {
  try {
    const admin = await requireAdmin(req);
    const db = getAdminDb();
    if (req.method === 'GET') {
      const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get();
      return json(res, 200, { users: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    if (req.method !== 'POST') return json(res, 405, { message: 'Method not allowed.' });
    const { action, uid, credits, plan, trialUntil, note } = req.body || {};
    if (!uid || !action) return json(res, 400, { message: 'uid and action are required.' });
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return json(res, 404, { message: 'User profile not found.' });
    const current = snap.data() || {};
    const update = { updatedAt: now(), founderActionBy: admin.uid };
    if (action === 'grantCredits') update.credits = Number(current.credits || 0) + Number(credits || 0);
    if (action === 'removeCredits') update.credits = Math.max(0, Number(current.credits || 0) - Number(credits || 0));
    if (action === 'setPlan') update.plan = String(plan || 'free');
    if (action === 'setTrial') { update.plan = 'pro'; update.trialUntil = trialUntil || null; }
    if (action === 'suspend') update.suspended = true;
    if (action === 'unsuspend') update.suspended = false;
    if (action === 'resetQuota') { update.dailyPromptUsage = 0; update.dailyImageUsage = 0; }
    if (action === 'note') update.founderNote = String(note || '').slice(0, 2000);
    if (!Object.keys(update).some(k => !['updatedAt','founderActionBy'].includes(k))) return json(res, 400, { message: 'Unsupported action.' });
    await ref.set(update, { merge: true });
    await db.collection('adminAuditLogs').add({ actorUid: admin.uid, action, targetUid: uid, details: { credits, plan, trialUntil, note: String(note || '').slice(0, 2000) }, createdAt: now() });
    return json(res, 200, { message: 'User updated successfully.' });
  } catch (e) { return json(res, 403, { message: e.message || 'Admin action failed.' }); }
}

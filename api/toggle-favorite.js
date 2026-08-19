import { adminAuth, adminDb, json } from './_firebaseAdmin.js';

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { code: 'method_not_allowed', message: 'Method not allowed.' });
  }

  try {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return json(res, 401, { code: 'unauthenticated', message: 'Please sign in to update favorites.' });

    let decoded;
    try {
      decoded = await adminAuth().verifyIdToken(token);
    } catch {
      return json(res, 401, { code: 'unauthenticated', message: 'Please sign in to update favorites.' });
    }

    const body = parseBody(req.body);
    const promptId = typeof body.promptId === 'string' ? body.promptId.trim() : '';
    const favorite = body.favorite;

    if (!promptId || promptId.length > 200 || typeof favorite !== 'boolean') {
      return json(res, 400, { code: 'invalid_request', message: 'Invalid favorite update.' });
    }

    const ref = adminDb().doc(`users/${decoded.uid}/prompts/${promptId}`);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return json(res, 404, { code: 'prompt_not_found', message: 'Prompt not found.' });
    }

    // Admin SDK access bypasses Firestore client rules, but ownership is still
    // enforced by deriving the document path exclusively from the verified UID.
    await ref.update({ favorite });
    return json(res, 200, { status: 'success', favorite });
  } catch (error) {
    console.error('Unable to update favorite:', error);
    return json(res, 500, { code: 'favorite_update_failed', message: 'Unable to update that favorite right now.' });
  }
}

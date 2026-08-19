import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export const subscribeToPromptHistory = (uid, onChange, onError) => {
  if (!uid) throw new Error("User not authenticated");
  const promptsRef = collection(db, "users", uid, "prompts");
  const q = query(promptsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
};

export const deletePrompt = async (uid, promptId) => {
  if (!uid || !promptId) throw new Error("Missing user or prompt ID");
  await deleteDoc(doc(db, "users", uid, "prompts", promptId));
};

export const setPromptFavorite = async (uid, promptId, favorite) => {
  if (!uid || !promptId) throw new Error("Missing user or prompt ID");

  try {
    await updateDoc(doc(db, "users", uid, "prompts", promptId), {
      favorite: Boolean(favorite),
    });
    return;
  } catch (error) {
    // Keep the normal client-side Firestore path first. If an environment is
    // still serving the previous Firestore rules, retry through the authenticated
    // server path so favorites remain reliable without weakening access control.
    if (error?.code !== "permission-denied") throw error;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await currentUser.getIdToken();
  const response = await fetch("/api/share-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: "favorite", promptId, favorite: Boolean(favorite) }),
  });

  if (!response.ok) {
    let payload = null;
    try { payload = await response.json(); } catch { /* ignore malformed error payload */ }
    const fallbackError = new Error(payload?.message || "Unable to update that favorite right now.");
    fallbackError.status = response.status;
    throw fallbackError;
  }
};

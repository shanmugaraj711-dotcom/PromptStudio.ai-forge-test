import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase";

export const savePrompt = async (uid, promptData) => {
  if (!uid) {
    throw new Error("User not authenticated");
  }

  const promptsRef = collection(db, "users", uid, "prompts");

  const docRef = await addDoc(promptsRef, {
    prompt: promptData.prompt,
    aiModel: promptData.aiModel || "Gemini",
    category: promptData.category || "General",
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

export const getPromptHistory = async (uid) => {
  if (!uid) {
    throw new Error("User not authenticated");
  }

  const promptsRef = collection(db, "users", uid, "prompts");

  const q = query(
    promptsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
};

export const deletePrompt = async (uid, promptId) => {
  if (!uid || !promptId) {
    throw new Error("Missing user or prompt ID");
  }

  await deleteDoc(
    doc(db, "users", uid, "prompts", promptId)
  );
};

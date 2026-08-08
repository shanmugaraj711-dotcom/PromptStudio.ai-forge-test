import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const createOrUpdateUserDoc = async (user, name = null) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const displayName = name || user.displayName || user.email.split("@")[0];
  const photoURL =
    user.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: displayName,
      email: user.email,
      photoURL,
      plan: "free",
      promptsToday: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  } else {
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  }
};

export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: name
    });
    await createOrUpdateUserDoc(userCredential.user, name);
    return userCredential.user;
  } catch (error) {
    console.error("REGISTER FIREBASE ERROR:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await createOrUpdateUserDoc(userCredential.user);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await createOrUpdateUserDoc(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("GOOGLE FIREBASE ERROR:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};

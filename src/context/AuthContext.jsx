import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  resetPassword,
  getUserProfile,
} from "../services/authService";
import {
  isQuotaAtLeastAsNew,
  mergeProfileWithQuota,
  quotaFromProfile,
} from "../utils/profileQuota";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const latestQuotaRef = useRef({ quotaVersion: -1 });

  const updateQuotaState = useCallback((quota, credits = null) => {
    if (!quota) return;

    const nextQuota = quotaFromProfile(quota);
    const latestQuota = latestQuotaRef.current;

    const isNew = isQuotaAtLeastAsNew(nextQuota, latestQuota);
    if (isNew) {
      latestQuotaRef.current = nextQuota;
    }

    setUserProfile((profile) => {
      if (!profile) return null;
      let nextProfile = profile;
      if (isNew) {
        nextProfile = mergeProfileWithQuota(nextProfile, nextQuota);
      }
      if (credits != null) {
        nextProfile = { ...nextProfile, credits };
      }
      return nextProfile;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        const snapshotQuota = quotaFromProfile(profile);
        const latestQuota = latestQuotaRef.current;
        if (isQuotaAtLeastAsNew(snapshotQuota, latestQuota)) {
          latestQuotaRef.current = snapshotQuota;
          setUserProfile(profile);
        } else {
          setUserProfile(mergeProfileWithQuota(profile, latestQuota));
        }
      }
    } catch (error) {
      console.error("Manual profile refresh failed:", error);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    let unsubscribeProfile = () => {};

    const stopProfileListener = () => {
      unsubscribeProfile();
      unsubscribeProfile = () => {};
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      stopProfileListener();
      setUser(currentUser);
      latestQuotaRef.current = { quotaVersion: -1 };

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUserProfile(null);
      setLoading(true);
      const uid = currentUser.uid;

      unsubscribeProfile = onSnapshot(
        doc(db, "users", uid),
        (snapshot) => {
          if (!active || auth.currentUser?.uid !== uid) return;

          const profile = snapshot.exists() ? snapshot.data() : null;

          if (!profile) {
            setUserProfile(null);
            setLoading(false);
            return;
          }

          const snapshotQuota = quotaFromProfile(profile);
          const latestQuota = latestQuotaRef.current;

          if (isQuotaAtLeastAsNew(snapshotQuota, latestQuota)) {
            latestQuotaRef.current = snapshotQuota;
            setUserProfile(profile);
          } else {
            setUserProfile(mergeProfileWithQuota(profile, latestQuota));
          }

          setLoading(false);
        },
        (error) => {
          console.error("Unable to load the user profile:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      active = false;
      unsubscribeAuth();
      stopProfileListener();
    };
  }, []);

  const quota = quotaFromProfile(userProfile);

  const value = {
    user,
    userProfile,
    plan: quota.plan,
    promptsToday: quota.promptsToday,
    lastPromptDate: quota.lastPromptDate,
    loading,
    updateQuotaState,
    refreshProfile,

    signup: registerWithEmail,
    login: loginWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

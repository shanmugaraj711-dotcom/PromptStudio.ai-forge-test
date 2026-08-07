import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);

        if (unsubscribeProfile) {
          unsubscribeProfile();
        }

        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          setUserProfile(snapshot.exists() ? snapshot.data() : null);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,

    signup: registerWithEmail,
    login: loginWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

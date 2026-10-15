// src/contexts/AuthContext.jsx
// Firebase Auth state + Firestore user profile management.

import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function loadUserProfile(user) {
    if (!user) { setUserProfile(null); return; }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      setUserProfile(snap.exists() ? snap.data() : null);
    } catch {
      setUserProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await loadUserProfile(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  /** Email + password sign-up. Creates users/{uid} profile doc. */
  async function signUp(email, password, name, phone) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      name: name || '',
      phone: phone || '',
      address: '',
      email,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
    return user;
  }

  /** Email + password sign-in. */
  async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /** Google OAuth sign-in. Creates users/{uid} if it doesn't exist. */
  async function signInWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile = {
        name: user.displayName || '',
        phone: '',
        address: '',
        email: user.email || '',
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    } else {
      setUserProfile(snap.data());
    }
    return user;
  }

  async function logout() {
    await firebaseSignOut(auth);
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  /** Merge-updates users/{uid} and local profile state. */
  async function updateUserProfile(data) {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      authLoading,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      resetPassword,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

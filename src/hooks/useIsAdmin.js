// src/hooks/useIsAdmin.js
// Checks Firestore admins/{uid} to determine if the signed-in user is an admin.
// Returns { isAdmin: bool, adminLoading: bool }.

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useIsAdmin() {
  const { currentUser, authLoading } = useAuth();
  const [isAdmin, setIsAdmin]         = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { setIsAdmin(false); setAdminLoading(false); return; }

    getDoc(doc(db, 'admins', currentUser.uid))
      .then(snap => setIsAdmin(snap.exists()))
      .catch(() => setIsAdmin(false))
      .finally(() => setAdminLoading(false));
  }, [currentUser, authLoading]);

  return { isAdmin, adminLoading };
}

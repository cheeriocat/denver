// src/hooks/useSettings.js
// Fetches settings/store from Firestore. Falls back to sensible defaults
// if the doc hasn't been created yet (admin creates it in Phase 3).

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const DEFAULT_SETTINGS = {
  shippingFee: 350,
  freeShippingThreshold: 2500,
  bankName: 'Bank of Ceylon',
  bankAccountName: 'Denver Apparels (Pvt) Ltd',
  bankAccountNumber: '0000000000',
  bankBranch: 'Colombo 03',
  bankSwiftCode: '',
  whatsappNumber: '+94771234567',
  lowStockThreshold: 5,
  storeContact: '+94771234567',
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'store'))
      .then(snap => {
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      })
      .catch(console.error)
      .finally(() => setSettingsLoading(false));
  }, []);

  return { settings, settingsLoading };
}

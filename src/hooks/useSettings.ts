import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Settings } from '../types';

const DEFAULT: Settings = {
  targetExpenseRate: 30,
  residentialTaxRate: 10,
  consumptionTaxCategory: '第5種',
  consumptionTaxSpecialRate: 0.3,
  healthInsurance: 0,
  pension: 0,
  dependentDeduction: 0,
  lifeInsuranceDeduction: 0,
  idecoDeduction: 0,
  smallBusinessDeduction: 0,
  updatedAt: '',
};

const getRef = (uid: string) => doc(db, 'users', uid, 'settings', 'main');

export const useSettings = (isGuest: boolean) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setSettings(localStore.getItem<Settings>(LOCAL_KEYS.settings, DEFAULT));
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return; }
      const snap = await getDoc(getRef(user.uid));
      if (snap.exists()) setSettings({ ...DEFAULT, ...snap.data() } as Settings);
      setLoading(false);
    });
    return unsub;
  }, [isGuest]);

  const save = async (data: Omit<Settings, 'updatedAt'>): Promise<void> => {
    const record = { ...data, updatedAt: new Date().toISOString() };

    if (isGuest) {
      localStore.setItem(LOCAL_KEYS.settings, record);
      setSettings(record);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(getRef(uid), record);
    setSettings(record);
  };

  return { settings, loading, save };
};

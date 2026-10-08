import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Settings } from '../types';
import { runNetworkAction } from '../lib/network';

// Markdownプレビューの初期CSS。ユーザーはここから自由に編集できる。
export const DEFAULT_PREVIEW_CSS = `/* 背景色 */
body {
  background-color: #ffffff;
}

/* 文字サイズ */
body {
  font-size: 15px;
}

/* 文字色 */
body {
  color: #1a1a1a;
}

/* 表: 罫線1pxとヘッダー行の背景色（薄い灰色） */
table {
  border-collapse: collapse;
}
th, td {
  border: 1px solid #333333;
}
thead th {
  background-color: #eeeeee;
}
`;

const DEFAULT: Settings = {
  targetExpenseRate: 30,
  monthlyExpenseBudget: 0,
  residentialTaxRate: 10,
  consumptionTaxCategory: '第5種',
  consumptionTaxSpecialRate: 0.3,
  healthInsurance: 0,
  pension: 0,
  dependentDeduction: 0,
  lifeInsuranceDeduction: 0,
  idecoDeduction: 0,
  smallBusinessDeduction: 0,
  previewCustomCss: DEFAULT_PREVIEW_CSS,
  dailyReportDefaultStartTime: null,
  dailyReportDefaultEndTime: null,
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
    await runNetworkAction(() => setDoc(getRef(uid), record));
    setSettings(record);
  };

  return { settings, loading, save };
};

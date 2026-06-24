import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { DailyReport } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'dailyReports');

export const useDailyReports = (isGuest: boolean) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      const list = localStore.getList<DailyReport>(LOCAL_KEYS.dailyReports);
      setReports([...list].sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('date', 'desc'));
      return onSnapshot(q, (snap) => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyReport)));
        setLoading(false);
      });
    });
    return unsub;
  }, [isGuest]);

  const persistLocal = (list: DailyReport[]) => {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    setReports(sorted);
    localStore.setList(LOCAL_KEYS.dailyReports, sorted);
  };

  const save = async (date: string, done: string, plan: string, note: string, editId?: string) => {
    const now = new Date().toISOString();

    if (isGuest) {
      if (editId) {
        persistLocal(reports.map(r => r.id === editId ? { ...r, date, done, plan, note, updatedAt: now } : r));
      } else {
        const item: DailyReport = { id: crypto.randomUUID(), date, done, plan, note, createdAt: now, updatedAt: now };
        persistLocal([item, ...reports]);
      }
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (editId) {
      await updateDoc(doc(getRef(uid), editId), { date, done, plan, note, updatedAt: now });
    } else {
      await addDoc(getRef(uid), { date, done, plan, note, createdAt: now, updatedAt: now });
    }
  };

  const remove = async (id: string) => {
    if (isGuest) {
      persistLocal(reports.filter(r => r.id !== id));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { reports, loading, save, remove };
};

import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { DailyReport } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'dailyReports');

export const useDailyReports = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('date', 'desc'));
      return onSnapshot(q, (snap) => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyReport)));
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  const save = async (date: string, done: string, plan: string, note: string, editId?: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const now = new Date().toISOString();
    if (editId) {
      await updateDoc(doc(getRef(uid), editId), { date, done, plan, note, updatedAt: now });
    } else {
      await addDoc(getRef(uid), { date, done, plan, note, createdAt: now, updatedAt: now });
    }
  };

  const remove = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { reports, loading, save, remove };
};
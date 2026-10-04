import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc, deleteField, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { DailyReport, DailyReportInput } from '../types';
import { runNetworkAction } from '../lib/network';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'dailyReports');

export const useDailyReports = (isGuest: boolean) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingCreateId = useRef<string | null>(null);

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

  const save = async (input: DailyReportInput, editId?: string) => {
    const now = new Date().toISOString();
    const fields = {
      date: input.date,
      items: input.items
        .map(i => ({ content: i.content.trim(), hours: i.hours ?? null }))
        .filter(i => i.content !== ''),
      plan: input.plan,
      note: input.note,
      workStartTime: input.workStartTime || null,
      workEndTime: input.workEndTime || null,
      breakHours: input.breakHours ?? null,
    };

    if (isGuest) {
      if (editId) {
        persistLocal(reports.map(r => {
          // 旧形式の done は保存し直すタイミングで取り除く
          const { done, ...rest } = r;
          void done;
          return r.id === editId ? { ...rest, ...fields, updatedAt: now } : r;
        }));
      } else {
        const item: DailyReport = { id: crypto.randomUUID(), ...fields, createdAt: now, updatedAt: now };
        persistLocal([item, ...reports]);
      }
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (editId) {
      await runNetworkAction(() => updateDoc(doc(getRef(uid), editId), { ...fields, done: deleteField(), updatedAt: now }));
    } else {
      const clientId = pendingCreateId.current ?? crypto.randomUUID();
      pendingCreateId.current = clientId;
      await runNetworkAction(() => setDoc(doc(getRef(uid), clientId), { ...fields, createdAt: now, updatedAt: now }));
      pendingCreateId.current = null;
    }
  };

  const remove = async (id: string) => {
    if (isGuest) {
      persistLocal(reports.filter(r => r.id !== id));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await runNetworkAction(() => deleteDoc(doc(getRef(uid), id)));
  };

  return { reports, loading, save, remove };
};

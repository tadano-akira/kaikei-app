import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Memo, MemoCategory } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'memos');

export const useMemos = (isGuest: boolean) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setMemos(localStore.getList<Memo>(LOCAL_KEYS.memos));
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Memo)));
        setLoading(false);
      });
    });
    return unsub;
  }, [isGuest]);

  const persistLocal = (list: Memo[]) => {
    setMemos(list);
    localStore.setList(LOCAL_KEYS.memos, list);
  };

  const add = async (title: string, category: MemoCategory, body: string) => {
    const now = new Date().toISOString();

    if (isGuest) {
      const item: Memo = { id: crypto.randomUUID(), title, category, body, createdAt: now, updatedAt: now };
      persistLocal([item, ...memos]);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addDoc(getRef(uid), { title, category, body, createdAt: now, updatedAt: now });
  };

  const update = async (id: string, title: string, category: MemoCategory, body: string) => {
    const now = new Date().toISOString();

    if (isGuest) {
      persistLocal(memos.map(m => m.id === id ? { ...m, title, category, body, updatedAt: now } : m));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(getRef(uid), id), { title, category, body, updatedAt: now });
  };

  const remove = async (id: string) => {
    if (isGuest) {
      persistLocal(memos.filter(m => m.id !== id));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { memos, loading, add, update, remove };
};

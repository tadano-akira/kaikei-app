import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Memo, MemoCategory } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'memos');

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Memo)));
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  const add = async (title: string, category: MemoCategory, body: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const now = new Date().toISOString();
    await addDoc(getRef(uid), { title, category, body, createdAt: now, updatedAt: now });
  };

  const update = async (id: string, title: string, category: MemoCategory, body: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(getRef(uid), id), { title, category, body, updatedAt: new Date().toISOString() });
  };

  const remove = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { memos, loading, add, update, remove };
};
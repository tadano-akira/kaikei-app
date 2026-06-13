import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Todo, Priority } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'todos');

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)));
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  const add = async (text: string, priority: Priority) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const now = new Date().toISOString();
    await addDoc(getRef(uid), { text, priority, done: false, createdAt: now, updatedAt: now });
  };

  const toggle = async (id: string, done: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(getRef(uid), id), { done, updatedAt: new Date().toISOString() });
  };

  const remove = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { todos, loading, add, toggle, remove };
};
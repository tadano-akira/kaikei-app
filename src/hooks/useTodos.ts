import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Todo, Priority } from '../types';

const getRef = (uid: string) =>
  collection(db, 'users', uid, 'todos');

export const useTodos = (isGuest: boolean) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setTodos(localStore.getList<Todo>(LOCAL_KEYS.todos));
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }
      const q = query(getRef(user.uid), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)));
        setLoading(false);
      });
    });
    return unsub;
  }, [isGuest]);

  const persistLocal = (list: Todo[]) => {
    setTodos(list);
    localStore.setList(LOCAL_KEYS.todos, list);
  };

  const add = async (text: string, priority: Priority) => {
    const now = new Date().toISOString();

    if (isGuest) {
      const item: Todo = { id: crypto.randomUUID(), text, priority, done: false, createdAt: now, updatedAt: now };
      persistLocal([item, ...todos]);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addDoc(getRef(uid), { text, priority, done: false, createdAt: now, updatedAt: now });
  };

  const toggle = async (id: string, done: boolean) => {
    const now = new Date().toISOString();

    if (isGuest) {
      persistLocal(todos.map(t => t.id === id ? { ...t, done, updatedAt: now } : t));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(getRef(uid), id), { done, updatedAt: now });
  };

  const remove = async (id: string) => {
    if (isGuest) {
      persistLocal(todos.filter(t => t.id !== id));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(getRef(uid), id));
  };

  return { todos, loading, add, toggle, remove };
};

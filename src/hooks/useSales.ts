import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Sales, SalesInput } from '../types';

const getRef = (uid: string) => {
  const year = new Date().getFullYear().toString();
  return collection(db, 'users', uid, 'sales', year, 'items');
};

export const useSales = (isGuest: boolean) => {
  const [sales, setSales] = useState<Sales[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setSales(localStore.getList<Sales>(LOCAL_KEYS.sales));
      setFirestoreLoading(false);
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setFirestoreLoading(false); return; }

      const uid = user.uid;
      const year = new Date().getFullYear().toString();
      const ref = collection(db, 'users', uid, 'sales', year, 'items');

      const unsubscribeSnapshot = onSnapshot(ref,
        (snapshot) => {
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sales));
          items.sort((a, b) => b.date.localeCompare(a.date));
          setSales(items);
          setFirestoreLoading(false);
        },
        (error) => {
          console.error('Sales Firestoreエラー:', error);
          setFirestoreLoading(false);
        }
      );

      return unsubscribeSnapshot;
    });

    return unsubscribeAuth;
  }, [isGuest]);

  const persistLocal = (list: Sales[]) => {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    setSales(sorted);
    localStore.setList(LOCAL_KEYS.sales, sorted);
  };

  const save = async (input: SalesInput): Promise<void> => {
    const now = new Date().toISOString();

    if (isGuest) {
      const item: Sales = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      persistLocal([item, ...sales]);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const data = Object.fromEntries(
      Object.entries({ ...input, createdAt: now, updatedAt: now }).filter(([, v]) => v !== undefined)
    );
    await addDoc(getRef(uid), data);
  };

  const update = async (id: string, input: SalesInput): Promise<void> => {
    const now = new Date().toISOString();

    if (isGuest) {
      persistLocal(sales.map(s => s.id === id ? { ...s, ...input, updatedAt: now } : s));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const data = Object.fromEntries(
      Object.entries({ ...input, updatedAt: now }).filter(([, v]) => v !== undefined)
    );
    await updateDoc(doc(getRef(uid), id), data);
  };

  const remove = async (id: string): Promise<void> => {
    if (isGuest) {
      persistLocal(sales.filter(s => s.id !== id));
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    await deleteDoc(doc(getRef(uid), id));
  };

  const groupedByMonth = (): { month: string; items: Sales[] }[] => {
    const map = new Map<string, Sales[]>();
    for (const s of sales) {
      const month = s.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(s);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  };

  const currentMonthTotal = (): number => {
    const ym = new Date().toISOString().slice(0, 7);
    return sales
      .filter(s => s.date.startsWith(ym))
      .reduce((sum, s) => sum + s.amount, 0);
  };

  return { sales, firestoreLoading, save, update, remove, groupedByMonth, currentMonthTotal };
};

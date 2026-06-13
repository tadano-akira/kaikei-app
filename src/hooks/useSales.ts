import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Sales, SalesInput } from '../types';

const getRef = (uid: string) => {
  const year = new Date().getFullYear().toString();
  return collection(db, 'users', uid, 'sales', year, 'items');
};

export const useSales = () => {
  const [sales, setSales] = useState<Sales[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setFirestoreLoading(false); return; }

      const uid = user.uid;
      const year = new Date().getFullYear().toString();
      const ref = collection(db, 'users', uid, 'sales', year, 'items');
      const q = query(ref, orderBy('date', 'desc'));

      const unsubscribeSnapshot = onSnapshot(q,
        (snapshot) => {
          setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sales)));
          setFirestoreLoading(false);
        },
        () => setFirestoreLoading(false)
      );

      return unsubscribeSnapshot;
    });

    return unsubscribeAuth;
  }, []);

  const save = async (input: SalesInput): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const now = new Date().toISOString();
    await addDoc(getRef(uid), { ...input, createdAt: now, updatedAt: now });
  };

  const update = async (id: string, input: SalesInput): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    await updateDoc(doc(getRef(uid), id), { ...input, updatedAt: new Date().toISOString() });
  };

  const remove = async (id: string): Promise<void> => {
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

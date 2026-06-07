import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Expense, ExpenseInput } from '../types';
import { calcTax } from '../constants';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  const getCollectionRef = (uid: string) => {
    const year = new Date().getFullYear().toString();
    return collection(db, 'users', uid, 'expenses', year, 'items');
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setFirestoreLoading(false);
        return;
      }

      const uid = user.uid;
      console.log('uid:', uid);
      const year = new Date().getFullYear().toString();
      const ref = collection(db, 'users', uid, 'expenses', year, 'items');
      const q = query(ref, orderBy('date', 'desc'));

      const unsubscribeSnapshot = onSnapshot(q,
        (snapshot) => {
          console.log('snapshot件数:', snapshot.docs.length);
          const items: Expense[] = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          } as Expense));
          setExpenses(items);
          setFirestoreLoading(false);
        },
        (error) => {
          console.error('Firestoreエラー:', error);
          setFirestoreLoading(false);
        }
      );

      return unsubscribeSnapshot;
    });

    return unsubscribeAuth;
  }, []);

  const save = async (input: ExpenseInput): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const now = new Date().toISOString();
    await addDoc(getCollectionRef(uid), {
      ...input,
      amountWithoutTax,
      taxAmount,
      createdAt: now,
      updatedAt: now,
    });
  };

  const update = async (id: string, input: ExpenseInput): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const ref = doc(getCollectionRef(uid), id);
    await updateDoc(ref, {
      ...input,
      amountWithoutTax,
      taxAmount,
      updatedAt: new Date().toISOString(),
    });
  };

  const remove = async (id: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const ref = doc(getCollectionRef(uid), id);
    await deleteDoc(ref);
  };

  const groupedByMonth = (): { month: string; items: Expense[] }[] => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  };

  const currentMonthTotal = (): number => {
    const ym = new Date().toISOString().slice(0, 7);
    return expenses
      .filter(e => e.date.startsWith(ym))
      .reduce((sum, e) => sum + e.amountWithTax, 0);
  };

  return { expenses, firestoreLoading, save, update, remove, groupedByMonth, currentMonthTotal };
};
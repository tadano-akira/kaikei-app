import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';
import { Expense, ExpenseInput } from '../types';
import { calcTax } from '../constants';

export const useExpenses = (isGuest: boolean) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  const getCollectionRef = (uid: string) => {
    const year = new Date().getFullYear().toString();
    return collection(db, 'users', uid, 'expenses', year, 'items');
  };

  useEffect(() => {
    if (isGuest) {
      setExpenses(localStore.getList<Expense>(LOCAL_KEYS.expenses));
      setFirestoreLoading(false);
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setFirestoreLoading(false);
        return;
      }

      const uid = user.uid;
      const year = new Date().getFullYear().toString();
      const ref = collection(db, 'users', uid, 'expenses', year, 'items');
      const q = query(ref, orderBy('date', 'desc'));

      const unsubscribeSnapshot = onSnapshot(q,
        (snapshot) => {
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
  }, [isGuest]);

  // ゲストモード: state更新とlocalStorage保存をまとめて行う
  const persistLocal = (list: Expense[]) => {
    // 経費一覧は日付降順で表示するため、保存時にも揃えておく
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    setExpenses(sorted);
    localStore.setList(LOCAL_KEYS.expenses, sorted);
  };

  const save = async (input: ExpenseInput): Promise<void> => {
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const now = new Date().toISOString();

    if (isGuest) {
      const item: Expense = {
        ...input,
        id: crypto.randomUUID(),
        amountWithoutTax,
        taxAmount,
        createdAt: now,
        updatedAt: now,
      };
      persistLocal([item, ...expenses]);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    await addDoc(getCollectionRef(uid), {
      ...input,
      amountWithoutTax,
      taxAmount,
      createdAt: now,
      updatedAt: now,
    });
  };

  const update = async (id: string, input: ExpenseInput): Promise<void> => {
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const now = new Date().toISOString();

    if (isGuest) {
      const original = expenses.find(e => e.id === id);
      persistLocal(expenses.map(e => e.id === id
        ? { ...e, ...input, amountWithoutTax, taxAmount, updatedAt: now }
        : e
      ));
      if (!original) console.warn(`ゲストデータ更新: id=${id} が見つかりませんでした`);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('未ログイン');
    const ref = doc(getCollectionRef(uid), id);
    await updateDoc(ref, {
      ...input,
      amountWithoutTax,
      taxAmount,
      updatedAt: now,
    });
  };

  const remove = async (id: string): Promise<void> => {
    if (isGuest) {
      persistLocal(expenses.filter(e => e.id !== id));
      return;
    }

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
    const d = new Date();
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return expenses
      .filter(e => e.date.startsWith(ym))
      .reduce((sum, e) => sum + e.amountWithTax, 0);
  };

  return { expenses, firestoreLoading, save, update, remove, groupedByMonth, currentMonthTotal };
};

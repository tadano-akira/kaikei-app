import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Expense, ExpenseInput } from '../types';
import { calcTax } from '../constants';

// NOTE: モックデータは不要になったので mockData.ts は使いません

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  // Firestoreのパス: users/{userId}/expenses/{year}/items/{docId}
  const getCollectionRef = () => {
    const uid = auth.currentUser?.uid;
    const year = new Date().getFullYear().toString();
    if (!uid) throw new Error('未ログイン');
    return collection(db, 'users', uid, 'expenses', year, 'items');
  };

  // リアルタイム購読（画面を開いている間、自動で最新データを反映）
  useEffect(() => {
  const uid = auth.currentUser?.uid;
  console.log('uid:', uid); // ← UIDが出るか確認
  if (!uid) {
    setFirestoreLoading(false); // ← uidなしの場合もローディング解除
    return;
  }

  const year = new Date().getFullYear().toString();
  const ref = collection(db, 'users', uid, 'expenses', year, 'items');
  const q = query(ref, orderBy('date', 'desc'));

  const unsubscribe = onSnapshot(q,
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
      console.error('Firestoreエラー:', error); // ← エラー内容を表示
      setFirestoreLoading(false);
    }
  );

  return unsubscribe;
}, []);

  const save = async (input: ExpenseInput): Promise<void> => {
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const now = new Date().toISOString();
    const ref = getCollectionRef();
    await addDoc(ref, {
      ...input,
      amountWithoutTax,
      taxAmount,
      createdAt: now,
      updatedAt: now,
    });
  };

  const update = async (id: string, input: ExpenseInput): Promise<void> => {
    const { amountWithoutTax, taxAmount } = calcTax(input.amountWithTax, input.taxRate);
    const uid = auth.currentUser?.uid;
    const year = new Date().getFullYear().toString();
    if (!uid) throw new Error('未ログイン');
    const ref = doc(db, 'users', uid, 'expenses', year, 'items', id);
    await updateDoc(ref, {
      ...input,
      amountWithoutTax,
      taxAmount,
      updatedAt: new Date().toISOString(),
    });
  };

  const remove = async (id: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    const year = new Date().getFullYear().toString();
    if (!uid) throw new Error('未ログイン');
    const ref = doc(db, 'users', uid, 'expenses', year, 'items', id);
    await deleteDoc(ref);
  };

  // 月ごとにグルーピング（降順）
  const groupedByMonth = (): { month: string; items: Expense[] }[] => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  };

  // 当月合計
  const currentMonthTotal = (): number => {
    const ym = new Date().toISOString().slice(0, 7);
    return expenses
      .filter(e => e.date.startsWith(ym))
      .reduce((sum, e) => sum + e.amountWithTax, 0);
  };

  return { expenses, firestoreLoading, save, update, remove, groupedByMonth, currentMonthTotal };
};
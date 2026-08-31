import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { localStore, LOCAL_KEYS } from './localStore';
import { Expense, Sales, Todo, Memo, DailyReport, Settings } from '../types';

/**
 * ゲストモードのlocalStorageデータをFirestoreへ一括書き込みする。
 * ローカルIDをFirestoreのドキュメントIDとして維持する。
 * 同じ移行を再試行しても同じドキュメントへ書き込むため、重複を作らない。
 *
 * writeBatchは1回最大500件までという制約があるが、個人利用規模では十分。
 * 件数が極端に多い場合は呼び出し側でユーザーに警告する想定。
 */
export const migrateGuestDataToFirestore = async (uid: string): Promise<void> => {
  const batch = writeBatch(db);
  let opCount = 0;

  const expenses = localStore.getList<Expense>(LOCAL_KEYS.expenses);
  for (const e of expenses) {
    const year = e.date.slice(0, 4) || new Date().getFullYear().toString();
    const ref = doc(db, 'users', uid, 'expenses', year, 'items', e.id);
    const { id, ...rest } = e;
    void id;
    batch.set(ref, rest);
    opCount++;
  }

  const sales = localStore.getList<Sales>(LOCAL_KEYS.sales);
  for (const s of sales) {
    const year = s.date.slice(0, 4) || new Date().getFullYear().toString();
    const ref = doc(db, 'users', uid, 'sales', year, 'items', s.id);
    const { id, ...rest } = s;
    void id;
    batch.set(ref, rest);
    opCount++;
  }

  const todos = localStore.getList<Todo>(LOCAL_KEYS.todos);
  for (const t of todos) {
    const ref = doc(db, 'users', uid, 'todos', t.id);
    const { id, ...rest } = t;
    void id;
    batch.set(ref, rest);
    opCount++;
  }

  const memos = localStore.getList<Memo>(LOCAL_KEYS.memos);
  for (const m of memos) {
    const ref = doc(db, 'users', uid, 'memos', m.id);
    const { id, ...rest } = m;
    void id;
    batch.set(ref, rest);
    opCount++;
  }

  const dailyReports = localStore.getList<DailyReport>(LOCAL_KEYS.dailyReports);
  for (const r of dailyReports) {
    const ref = doc(db, 'users', uid, 'dailyReports', r.id);
    const { id, ...rest } = r;
    void id;
    batch.set(ref, rest);
    opCount++;
  }

  // notepadとsettingsは単一ドキュメントなのでバッチにまとめて入れる
  const notepadContent = localStore.getItem<string>(LOCAL_KEYS.notepad, '');
  if (notepadContent.trim().length > 0) {
    const ref = doc(db, 'users', uid, 'notepad', 'main');
    batch.set(ref, { content: notepadContent, updatedAt: new Date().toISOString() });
    opCount++;
  }

  const settingsRaw = localStorage.getItem(LOCAL_KEYS.settings);
  if (settingsRaw !== null) {
    const settings = localStore.getItem<Settings | null>(LOCAL_KEYS.settings, null);
    if (settings) {
      const ref = doc(db, 'users', uid, 'settings', 'main');
      batch.set(ref, settings);
      opCount++;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  localStore.clearAll();
};

/** 「移行しない」を選んだ場合: ゲストデータを完全に破棄する */
export const discardGuestData = (): void => {
  localStore.clearAll();
};

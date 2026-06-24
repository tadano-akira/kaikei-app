// ゲストモード用のlocalStorage操作ユーティリティ
// 各フックはこの薄いラッパー経由でゲストデータを読み書きする

export const LOCAL_KEYS = {
  expenses: 'local_expenses',
  sales: 'local_sales',
  todos: 'local_todos',
  memos: 'local_memos',
  notepad: 'local_notepad',
  dailyReports: 'local_dailyReports',
  settings: 'local_settings',
} as const;

export type LocalKey = typeof LOCAL_KEYS[keyof typeof LOCAL_KEYS];

const readRaw = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`localStorage読み込みエラー (${key}):`, e);
    return fallback;
  }
};

const writeRaw = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`localStorage書き込みエラー (${key}):`, e);
  }
};

export const localStore = {
  /** 配列データを取得（経費・売上・ToDo・メモ・日報用） */
  getList: <T>(key: LocalKey): T[] => readRaw<T[]>(key, []),

  /** 配列データを保存 */
  setList: (key: LocalKey, list: unknown[]): void => writeRaw(key, list),

  /** 単一オブジェクト/値を取得（テキスト・設定用） */
  getItem: <T>(key: LocalKey, fallback: T): T => readRaw<T>(key, fallback),

  /** 単一オブジェクト/値を保存 */
  setItem: (key: LocalKey, value: unknown): void => writeRaw(key, value),

  /** 指定キーを削除 */
  remove: (key: LocalKey): void => localStorage.removeItem(key),

  /** 全ゲストキーを削除（移行完了後・破棄選択時に使用） */
  clearAll: (): void => {
    Object.values(LOCAL_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

/** 1件以上のゲストデータが存在するか確認する */
export const hasGuestData = (): boolean => {
  return Object.values(LOCAL_KEYS).some((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return false;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.length > 0;
      if (typeof parsed === 'string') return parsed.trim().length > 0;
      if (parsed && typeof parsed === 'object') return Object.keys(parsed).length > 0;
      return false;
    } catch {
      return false;
    }
  });
};

/** ダイアログ表示用の件数サマリー */
export interface GuestDataSummary {
  expenses: number;
  sales: number;
  todos: number;
  memos: number;
  dailyReports: number;
  hasNotepad: boolean;
  hasSettings: boolean;
}

export const getGuestDataSummary = (): GuestDataSummary => ({
  expenses: localStore.getList(LOCAL_KEYS.expenses).length,
  sales: localStore.getList(LOCAL_KEYS.sales).length,
  todos: localStore.getList(LOCAL_KEYS.todos).length,
  memos: localStore.getList(LOCAL_KEYS.memos).length,
  dailyReports: localStore.getList(LOCAL_KEYS.dailyReports).length,
  hasNotepad: localStore.getItem(LOCAL_KEYS.notepad, '').trim().length > 0,
  hasSettings: localStorage.getItem(LOCAL_KEYS.settings) !== null,
});

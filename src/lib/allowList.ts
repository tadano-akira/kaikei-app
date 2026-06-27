// ログインを許可するGmailアドレスのチェック。
//
// 背景: Firebase AuthenticationのGoogleログイン（GoogleAuthProvider）は
// 「Sign in with Google」の基本スコープ（email/profile/openid）のみを使うため、
// Google Cloud ConsoleのOAuth同意画面がテストモードであっても
// テストユーザーリストに登録していない一般のGoogleアカウントでも
// ログイン自体は通ってしまう（Googleの仕様）。そのためアプリ側で許可リストを持って制限する。
//
// VITE_ALLOWED_EMAILS にカンマ区切りでメールアドレスを設定する（.env.local）。
// 未設定の場合は誰でもログイン可能（開発時の事故防止のため、空リストでの
// 全拒否ではなく全許可にフォールバックする）。

const rawList = import.meta.env.VITE_ALLOWED_EMAILS ?? '';

export const ALLOWED_EMAILS: string[] = rawList
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter((s: string) => s.length > 0);

/** 許可リストが設定されているか（未設定なら制限なしとして呼び出し側が扱う） */
export const hasAllowList = ALLOWED_EMAILS.length > 0;

/** 指定したメールアドレスがログイン許可リストに含まれるか判定する */
export const isEmailAllowed = (email: string | null | undefined): boolean => {
  if (!hasAllowList) return true; // 許可リスト未設定時は制限しない
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};

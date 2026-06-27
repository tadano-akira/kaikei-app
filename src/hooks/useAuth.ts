import { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../lib/firebase';
import { isEmailAllowed } from '../lib/allowList';

export type AuthMode = 'loading' | 'guest' | 'loggedIn';

// authMode の遷移:
//   'loading'  : Firebase認証確認中、またはログイン画面を表示すべき状態（未ログイン・ゲストでもない）
//   'guest'    : LoginPageで「ログインせずに試す」を選択した状態（localStorage使用）
//   'loggedIn' : Googleログイン済み（Firestore使用）
//
// App.tsx側では authChecked && authMode === 'loading' のときに LoginPage を表示する。
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  // 初回のFirebase認証確認が終わるまでは 'loading'。
  // 確認が終わってユーザーがいなければ未ログイン状態（LoginPage表示）。
  // LoginPageで「ログインせずに試す」を押すと 'guest' になる。
  // ログインに成功すると 'loggedIn' になる。
  const [authMode, setAuthMode] = useState<AuthMode>('loading');
  const [authChecked, setAuthChecked] = useState(false);
  // 許可リスト外のアカウントでログインを試みた場合のエラーメッセージ
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      // 許可リスト外のアカウントはページ再読み込みでのセッション復帰も含めて弾く
      if (u && !isEmailAllowed(u.email)) {
        await signOut(auth);
        setUser(null);
        setAuthChecked(true);
        setAuthMode('loading');
        setAuthError('このGoogleアカウントではログインできません。許可されたアカウントでログインしてください。');
        return;
      }

      setUser(u);
      setAuthChecked(true);
      if (u) {
        setAuthMode('loggedIn');
      } else {
        // ゲストモード中の場合はゲストのまま維持。それ以外は 'loading'（=LoginPage表示）に倒す。
        setAuthMode((prev) => (prev === 'guest' ? 'guest' : 'loading'));
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    setAuthError(null);
    await signInWithPopup(auth, provider);
    // 成功後の許可リストチェックは onAuthStateChanged 側で一元的に行う
  };

  const logout = async () => {
    await signOut(auth);
    setAuthMode('loading');
  };

  const enterGuestMode = () => {
    setAuthError(null);
    setAuthMode('guest');
  };

  return { user, authMode, authChecked, authError, login, logout, enterGuestMode };
};

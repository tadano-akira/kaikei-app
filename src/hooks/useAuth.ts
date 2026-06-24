import { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../lib/firebase';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
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

  const login = () => signInWithPopup(auth, provider);

  const logout = async () => {
    await signOut(auth);
    setAuthMode('loading');
  };

  const enterGuestMode = () => setAuthMode('guest');

  return { user, authMode, authChecked, login, logout, enterGuestMode };
};

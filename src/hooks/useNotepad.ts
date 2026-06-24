import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { localStore, LOCAL_KEYS } from '../lib/localStore';

const getRef = (uid: string) =>
  doc(db, 'users', uid, 'notepad', 'main');

export const useNotepad = (isGuest: boolean) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setContent(localStore.getItem<string>(LOCAL_KEYS.notepad, ''));
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return; }
      const snap = await getDoc(getRef(user.uid));
      if (snap.exists()) setContent(snap.data().content ?? '');
      setLoading(false);
    });
    return unsub;
  }, [isGuest]);

  const save = async () => {
    if (isGuest) {
      localStore.setItem(LOCAL_KEYS.notepad, content);
      setSaved(true);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(getRef(uid), { content, updatedAt: new Date().toISOString() });
    setSaved(true);
  };

  const onChange = (val: string) => {
    setContent(val);
    setSaved(false);
  };

  return { content, loading, saved, onChange, save };
};

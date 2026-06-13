import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const getRef = (uid: string) =>
  doc(db, 'users', uid, 'notepad', 'main');

export const useNotepad = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return; }
      const snap = await getDoc(getRef(user.uid));
      if (snap.exists()) setContent(snap.data().content ?? '');
      setLoading(false);
    });
    return unsub;
  }, []);

  const save = async () => {
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
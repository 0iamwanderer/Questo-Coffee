'use client';

import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

/**
 * Müşteri cihazı için anonim Firebase oturumu sağlar.
 * Mevcut oturum varsa onu döner, yoksa açar.
 */
export const anonGirisiSagla = async (): Promise<User> => {
  const auth = getClientAuth();
  if (auth.currentUser) return auth.currentUser;

  return new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        if (u) {
          unsub();
          resolve(u);
          return;
        }
        try {
          const res = await signInAnonymously(auth);
          unsub();
          resolve(res.user);
        } catch (e) {
          unsub();
          reject(e);
        }
      },
      (e) => {
        unsub();
        reject(e);
      },
    );
  });
};

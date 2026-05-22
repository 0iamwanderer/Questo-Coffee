'use client';

import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  type User,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

/**
 * Müşteri cihazı için anonim Firebase oturumu sağlar.
 * Mevcut oturum varsa direkt döner; yoksa auth durumu hazır olunca açar.
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

/**
 * Mevcut oturumu sonlandırıp yeni anonim oturum açar.
 * Sunucu 401 (token revoked/expired) döndürdüğünde çağrılır.
 */
export const anonYenile = async (): Promise<User> => {
  const auth = getClientAuth();
  await signOut(auth).catch(() => {});
  const res = await signInAnonymously(auth);
  return res.user;
};

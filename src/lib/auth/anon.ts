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
 * Mevcut oturum varsa token yenilemeyi dener; başarısız olursa (emulator
 * yeniden başlatma gibi durumlar) çıkış yapıp yeni anonim oturum açar.
 */
export const anonGirisiSagla = async (): Promise<User> => {
  const auth = getClientAuth();

  if (auth.currentUser) {
    try {
      await auth.currentUser.getIdToken(/* forceRefresh= */ true);
      return auth.currentUser;
    } catch {
      // Token geçersiz — yeni oturum açılacak
      await signOut(auth).catch(() => {});
    }
  }

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

import 'server-only';

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export const COOKIE_ADI = '__session';
const BES_GUN_MS = 5 * 24 * 60 * 60 * 1000;

export const oturumCereziUret = async (idToken: string): Promise<string> => {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: BES_GUN_MS });
};

export const oturumCereziDogrula =
  async (): Promise<DecodedIdToken | null> => {
    const c = (await cookies()).get(COOKIE_ADI)?.value;
    if (!c) return null;
    try {
      // ikinci parametre `checkRevoked` — yetkisi alınmış kullanıcıyı engeller
      return await getAdminAuth().verifySessionCookie(c, true);
    } catch {
      return null;
    }
  };

export const cerezAyarla = async (value: string): Promise<void> => {
  (await cookies()).set(COOKIE_ADI, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: BES_GUN_MS / 1000,
  });
};

export const cerezSil = async (): Promise<void> => {
  (await cookies()).delete(COOKIE_ADI);
};

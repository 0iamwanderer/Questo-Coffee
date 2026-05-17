import 'server-only';

import { redirect } from 'next/navigation';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { oturumCereziDogrula } from './session';
import { AppError } from '@/lib/utils/hata';
import type { PersonelClaims } from '@/types/model';

export interface OturumKullanicisi {
  uid: string;
  email: string | undefined;
  claims: PersonelClaims;
}

const claimsCikar = (d: DecodedIdToken): PersonelClaims | null => {
  const rol = d.rol;
  const restoranId = d.restoranId;
  if (rol !== 'kasiyer' || typeof restoranId !== 'string') return null;
  return {
    rol: 'kasiyer',
    sahip: d.sahip === true,
    restoranId,
  };
};

export const oturumuGetir = async (): Promise<OturumKullanicisi | null> => {
  const decoded = await oturumCereziDogrula();
  if (!decoded) return null;
  const claims = claimsCikar(decoded);
  if (!claims) return null;
  return { uid: decoded.uid, email: decoded.email, claims };
};

// ── Sayfa (RSC) guard'ları — yetkisiz ise /kasa/giris'e yönlendirir ─────
export const kasiyerGerekli = async (
  geri?: string,
): Promise<OturumKullanicisi> => {
  const u = await oturumuGetir();
  if (!u) {
    const q = geri ? `?geri=${encodeURIComponent(geri)}` : '';
    redirect(`/kasa/giris${q}`);
  }
  return u;
};

export const sahipGerekli = async (
  geri?: string,
): Promise<OturumKullanicisi> => {
  const u = await kasiyerGerekli(geri);
  if (!u.claims.sahip) {
    throw new AppError('yetkisiz', 'Yalnızca sahip yetkili.', 403);
  }
  return u;
};

// ── API route guard'ları — yönlendirme yerine AppError fırlatır ─────────
export const apiKasiyer = async (): Promise<OturumKullanicisi> => {
  const u = await oturumuGetir();
  if (!u) throw new AppError('yetkisiz', 'Giriş yapılmamış.', 401);
  return u;
};

export const apiSahip = async (): Promise<OturumKullanicisi> => {
  const u = await apiKasiyer();
  if (!u.claims.sahip) {
    throw new AppError('yetkisiz', 'Sahip yetkisi gerekli.', 403);
  }
  return u;
};

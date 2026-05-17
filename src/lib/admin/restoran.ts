import 'server-only';
import { AppError } from '@/lib/utils/hata';
import type { OturumKullanicisi } from '@/lib/auth/guard';

export const restoranIdGetir = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export const kapsamiDogrula = (u: OturumKullanicisi): string => {
  const R = restoranIdGetir();
  if (u.claims.restoranId !== R) {
    throw new AppError('yetkisiz', 'Restoran kapsamı uyuşmuyor.', 403);
  }
  return R;
};

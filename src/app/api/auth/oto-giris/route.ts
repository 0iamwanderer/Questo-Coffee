import { getAdminAuth } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const email =
      process.env.KASA_OTOGIRIS_EMAIL ?? process.env.SEED_SAHIP_EMAIL;
    if (!email) {
      throw new AppError(
        'yapilandirma_eksik',
        'Otomatik giriş için KASA_OTOGIRIS_EMAIL tanımlanmalı.',
        500,
      );
    }

    const user = await getAdminAuth().getUserByEmail(email);
    const claims = (user.customClaims ?? {}) as {
      rol?: string;
      sahip?: boolean;
      restoranId?: string;
    };
    if (claims.rol !== 'kasiyer') {
      throw new AppError(
        'yapilandirma_eksik',
        `Otomatik giriş kullanıcısı (${email}) için kasiyer claim'i yok.`,
        500,
      );
    }

    const customToken = await getAdminAuth().createCustomToken(user.uid, {
      rol: 'kasiyer',
      sahip: claims.sahip === true,
      ...(claims.restoranId ? { restoranId: claims.restoranId } : {}),
    });

    return Response.json({ ok: true, customToken });
  } catch (e) {
    return httpHata(e);
  }
}

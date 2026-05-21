import { FieldValue } from 'firebase-admin/firestore';
import { apiKasiyer } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { uretMasaToken } from '@/lib/utils/token';

export const runtime = 'nodejs';

const restoranId = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await apiKasiyer();
    const R = restoranId();
    if (u.claims.restoranId !== R) {
      throw new AppError('yetkisiz', 'Restoran kapsamı uyuşmuyor.', 403);
    }

    const { id } = await params;
    const db = getAdminDb();
    const aRef = db.doc(`restoranlar/${R}/adisyonlar/${id}`);

    let masaId: string | undefined;

    await db.runTransaction(async (tx) => {
      const aSnap = await tx.get(aRef);
      if (!aSnap.exists) {
        throw new AppError('adisyon_yok', 'Adisyon bulunamadı.', 404);
      }
      const a = aSnap.data() as { durum: string; masaId: string };
      if (a.durum !== 'acik') {
        throw new AppError('zaten_kapali', 'Adisyon zaten kapalı.', 409);
      }
      masaId = a.masaId;
      tx.update(aRef, {
        durum: 'kapali',
        kapanisAt: FieldValue.serverTimestamp(),
      });
    });

    // Masa token'ını rotate et — eski bağlantılar geçersiz olur
    if (masaId) {
      await db
        .doc(`restoranlar/${R}/masalar/${masaId}`)
        .update({ token: uretMasaToken() });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';

export const runtime = 'nodejs';

const Govde = z.object({
  masaToken: z.string().min(16).max(64),
  urunId: z.string().min(1).max(64).optional(),
});

const restoranId = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function POST(req: Request) {
  try {
    const body = Govde.parse(await req.json());
    const R = restoranId();
    const db = getAdminDb();

    const masaSnap = await db
      .collection(`restoranlar/${R}/masalar`)
      .where('token', '==', body.masaToken)
      .where('aktifMi', '==', true)
      .limit(1)
      .get();
    if (masaSnap.empty) {
      throw new AppError('masa_yok', 'Masa bulunamadı.', 404);
    }
    const masa = masaSnap.docs[0]!;

    await db.collection(`restoranlar/${R}/cagri`).add({
      masaId: masa.id,
      urunId: body.urunId ?? null,
      durum: 'bekliyor',
      olusturulduAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

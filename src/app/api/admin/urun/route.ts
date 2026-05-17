import { FieldValue } from 'firebase-admin/firestore';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { UrunGirdi } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const body = UrunGirdi.parse(await req.json());

    const db = getAdminDb();
    const katSnap = await db
      .doc(`restoranlar/${R}/kategoriler/${body.kategoriId}`)
      .get();
    if (!katSnap.exists) {
      throw new AppError('kategori_yok', 'Geçersiz kategori.', 400);
    }

    const ref = await db.collection(`restoranlar/${R}/urunler`).add({
      ...body,
      olusturulduAt: FieldValue.serverTimestamp(),
    });

    await auditLogla(u, R, {
      aksiyon: 'urun.create',
      kaynak: `urunler/${ref.id}`,
      sonrakiVeri: body,
    });

    return Response.json({ ok: true, id: ref.id });
  } catch (e) {
    return httpHata(e);
  }
}

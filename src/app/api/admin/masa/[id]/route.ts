import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { MasaYama } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';

export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const { id } = await params;
    const body = MasaYama.parse(await req.json());

    await getAdminDb().doc(`restoranlar/${R}/masalar/${id}`).update(body);
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const { id } = await params;
    const db = getAdminDb();

    // Bu masaya bağlı açık adisyon varsa silmeyi reddet
    const acik = await db
      .collection(`restoranlar/${R}/adisyonlar`)
      .where('masaId', '==', id)
      .where('durum', '==', 'acik')
      .limit(1)
      .get();
    if (!acik.empty) {
      throw new AppError(
        'acik_adisyon_var',
        'Bu masada açık adisyon var. Önce kapatın.',
        409,
      );
    }

    await db.doc(`restoranlar/${R}/masalar/${id}`).delete();
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

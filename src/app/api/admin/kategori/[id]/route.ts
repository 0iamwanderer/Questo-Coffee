import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { KategoriYama } from '@/lib/utils/zod-semalar';
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
    const body = KategoriYama.parse(await req.json());

    await getAdminDb()
      .doc(`restoranlar/${R}/kategoriler/${id}`)
      .update(body);

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

    // Bu kategoriye bağlı ürün varsa silmeyi reddet
    const urunSnap = await db
      .collection(`restoranlar/${R}/urunler`)
      .where('kategoriId', '==', id)
      .limit(1)
      .get();
    if (!urunSnap.empty) {
      throw new AppError(
        'kategoride_urun_var',
        'Bu kategoride ürünler var. Önce ürünleri silin veya taşıyın.',
        409,
      );
    }

    await db.doc(`restoranlar/${R}/kategoriler/${id}`).delete();
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

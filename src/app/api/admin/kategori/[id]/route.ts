import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { KategoriYama } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';

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

    const ref = getAdminDb().doc(`restoranlar/${R}/kategoriler/${id}`);
    const onceki = (await ref.get()).data();
    await ref.update(body);

    await auditLogla(u, R, {
      aksiyon: 'kategori.update',
      kaynak: `kategoriler/${id}`,
      oncekiVeri: onceki,
      sonrakiVeri: body,
    });

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

    const ref = db.doc(`restoranlar/${R}/kategoriler/${id}`);
    const onceki = (await ref.get()).data();
    await ref.delete();

    await auditLogla(u, R, {
      aksiyon: 'kategori.delete',
      kaynak: `kategoriler/${id}`,
      oncekiVeri: onceki,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

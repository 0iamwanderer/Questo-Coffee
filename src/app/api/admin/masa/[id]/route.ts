import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { MasaYama } from '@/lib/utils/zod-semalar';
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
    const body = MasaYama.parse(await req.json());

    const ref = getAdminDb().doc(`restoranlar/${R}/masalar/${id}`);
    const onceki = (await ref.get()).data();
    await ref.update(body);

    await auditLogla(u, R, {
      aksiyon: 'masa.update',
      kaynak: `masalar/${id}`,
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

    const ref = db.doc(`restoranlar/${R}/masalar/${id}`);
    const onceki = (await ref.get()).data();
    await ref.delete();

    await auditLogla(u, R, {
      aksiyon: 'masa.delete',
      kaynak: `masalar/${id}`,
      oncekiVeri: onceki,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

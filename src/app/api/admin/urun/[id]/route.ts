import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { UrunYama } from '@/lib/utils/zod-semalar';
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
    const body = UrunYama.parse(await req.json());

    const ref = getAdminDb().doc(`restoranlar/${R}/urunler/${id}`);
    const onceki = (await ref.get()).data();
    await ref.update(body);

    await auditLogla(u, R, {
      aksiyon: 'urun.update',
      kaynak: `urunler/${id}`,
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

    const ref = getAdminDb().doc(`restoranlar/${R}/urunler/${id}`);
    const onceki = (await ref.get()).data();
    await ref.delete();

    await auditLogla(u, R, {
      aksiyon: 'urun.delete',
      kaynak: `urunler/${id}`,
      oncekiVeri: onceki,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { UrunYama } from '@/lib/utils/zod-semalar';
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
    const body = UrunYama.parse(await req.json());

    await getAdminDb().doc(`restoranlar/${R}/urunler/${id}`).update(body);
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

    await getAdminDb().doc(`restoranlar/${R}/urunler/${id}`).delete();
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

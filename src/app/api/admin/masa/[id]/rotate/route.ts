import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { uretMasaToken } from '@/lib/utils/token';

export const runtime = 'nodejs';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const { id } = await params;

    const yeniToken = uretMasaToken();
    await getAdminDb()
      .doc(`restoranlar/${R}/masalar/${id}`)
      .update({ token: yeniToken });

    return Response.json({ ok: true, token: yeniToken });
  } catch (e) {
    return httpHata(e);
  }
}

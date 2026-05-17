import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { RestoranAyar } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const body = RestoranAyar.parse(await req.json());

    await getAdminDb()
      .doc(`restoranlar/${R}`)
      .set(body, { merge: true });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

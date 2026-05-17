import { FieldValue } from 'firebase-admin/firestore';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { KategoriGirdi } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const body = KategoriGirdi.parse(await req.json());

    const ref = await getAdminDb()
      .collection(`restoranlar/${R}/kategoriler`)
      .add({
        ...body,
        olusturulduAt: FieldValue.serverTimestamp(),
      });

    return Response.json({ ok: true, id: ref.id });
  } catch (e) {
    return httpHata(e);
  }
}

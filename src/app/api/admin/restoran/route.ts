import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { RestoranAyar } from '@/lib/utils/zod-semalar';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const body = RestoranAyar.parse(await req.json());

    const ref = getAdminDb().doc(`restoranlar/${R}`);
    const onceki = (await ref.get()).data();
    await ref.set(body, { merge: true });

    await auditLogla(u, R, {
      aksiyon: 'restoran.update',
      kaynak: `restoranlar/${R}`,
      oncekiVeri: onceki,
      sonrakiVeri: body,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

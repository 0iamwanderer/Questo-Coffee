import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';

export const runtime = 'nodejs';

const Govde = z.object({
  adisyonId: z.string().min(1).max(64),
  siparisId: z.string().min(1).max(64),
  // true → rapordan çıkar (denemelik), false → rapora geri dahil et
  haric: z.boolean(),
});

/**
 * Bir siparişi günlük rapordan hariç tutar / geri dahil eder. Sipariş ve
 * adisyon verisine dokunulmaz; yalnız `raporDisi` bayrağı güncellenir. Böylece
 * denemelik/test siparişleri ciroyu bozmadan rapordan çıkarılabilir.
 */
export async function POST(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const body = Govde.parse(await req.json());

    const ref = getAdminDb().doc(
      `restoranlar/${R}/adisyonlar/${body.adisyonId}/siparisler/${body.siparisId}`,
    );
    const snap = await ref.get();
    if (!snap.exists) {
      throw new AppError('siparis_yok', 'Sipariş bulunamadı.', 404);
    }

    await ref.update({
      raporDisi: body.haric ? true : FieldValue.delete(),
    });

    await auditLogla(u, R, {
      aksiyon: 'siparis.rapor-disi',
      kaynak: `adisyonlar/${body.adisyonId}/siparisler/${body.siparisId}`,
      sonrakiVeri: { raporDisi: body.haric },
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

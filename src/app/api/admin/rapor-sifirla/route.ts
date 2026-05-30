import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';
import { istanbulGunAraligi } from '@/lib/siparis/sayac';

export const runtime = 'nodejs';

const Govde = z.object({
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // true → o günün TÜM siparişlerini rapordan çıkar (sıfırla)
  // false → o günün hariç tutulan siparişlerini rapora geri ekle (geri al)
  haric: z.boolean(),
});

/**
 * Seçili günün raporunu sıfırlar (tüm siparişleri rapor dışı bırakır) ya da
 * sıfırlamayı geri alır. Sipariş/adisyon verisine dokunulmaz; yalnız her
 * siparişin `raporDisi` bayrağı toplu güncellenir. Otomatik kayıt aynen sürer.
 */
export async function POST(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const { tarih, haric } = Govde.parse(await req.json());

    const db = getAdminDb();
    const { baslangic, bitis } = istanbulGunAraligi(tarih);

    const snap = await db
      .collectionGroup('siparisler')
      .where('olusturulduAt', '>=', Timestamp.fromDate(baslangic))
      .where('olusturulduAt', '<=', Timestamp.fromDate(bitis))
      .get();

    const hedefler = snap.docs.filter((d) =>
      d.ref.path.startsWith(`restoranlar/${R}/`),
    );

    // 500'lük batch limiti — parça parça yaz
    let sayac = 0;
    for (let i = 0; i < hedefler.length; i += 450) {
      const batch = db.batch();
      for (const d of hedefler.slice(i, i + 450)) {
        batch.update(d.ref, {
          raporDisi: haric ? true : FieldValue.delete(),
        });
        sayac++;
      }
      await batch.commit();
    }

    await auditLogla(u, R, {
      aksiyon: 'rapor.sifirla',
      kaynak: `rapor/${tarih}`,
      sonrakiVeri: { haric, etkilenen: sayac },
    });

    return Response.json({ ok: true, etkilenen: sayac });
  } catch (e) {
    return httpHata(e);
  }
}

import { z } from 'zod';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { kapsamiDogrula } from '@/lib/admin/restoran';
import { auditLogla } from '@/lib/audit/log';

export const runtime = 'nodejs';

const Govde = z.object({
  adisyonId: z.string().min(1).max(64),
  siparisId: z.string().min(1).max(64),
});

/**
 * Bir siparişi KALICI olarak siler (denemelik/test siparişlerini temizlemek
 * için). Adisyon toplamı/sipariş sayısı düşülür, kalemlerin stoğu geri verilir.
 * Adisyon başka sipariş kalmadan boşalırsa adisyon ve ödeme talepleri de
 * silinir — böylece test masası açık kalmaz. Geri alınamaz.
 */
export async function POST(req: Request) {
  try {
    const u = await apiSahip();
    const R = kapsamiDogrula(u);
    const { adisyonId, siparisId } = Govde.parse(await req.json());

    const db = getAdminDb();
    const sRef = db.doc(
      `restoranlar/${R}/adisyonlar/${adisyonId}/siparisler/${siparisId}`,
    );
    const aRef = db.doc(`restoranlar/${R}/adisyonlar/${adisyonId}`);

    let adisyonSilindi = false;

    await db.runTransaction(async (tx) => {
      // ── Okumalar ───────────────────────────────────────────────────
      const sSnap = await tx.get(sRef);
      if (!sSnap.exists) {
        throw new AppError('siparis_yok', 'Sipariş bulunamadı.', 404);
      }
      const s = sSnap.data() as {
        durum: string;
        toplamKurus: number;
        kalemler?: Array<{ urunId: string; adet: number }>;
      };

      const aSnap = await tx.get(aRef);
      const a = aSnap.exists
        ? (aSnap.data() as { toplamKurus: number; siparisSayisi: number })
        : null;

      const yeniSiparisSayisi = a ? Math.max(0, a.siparisSayisi - 1) : 0;
      const adisyonBosalacak = a !== null && yeniSiparisSayisi <= 0;

      // Stok geri alımı — iptal edilmemiş siparişin kalemlerini stoka geri ekle
      const stokGeriAlim: Array<{
        ref: FirebaseFirestore.DocumentReference;
        miktar: number;
      }> = [];
      if (s.durum !== 'iptal' && s.kalemler && s.kalemler.length > 0) {
        const istenenMap = new Map<string, number>();
        for (const k of s.kalemler) {
          istenenMap.set(k.urunId, (istenenMap.get(k.urunId) ?? 0) + k.adet);
        }
        for (const [urunId, adet] of istenenMap.entries()) {
          const uRef = db.doc(`restoranlar/${R}/urunler/${urunId}`);
          const uSnap = await tx.get(uRef);
          if (!uSnap.exists) continue;
          const ud = uSnap.data() as { stokMiktar?: number };
          if (typeof ud.stokMiktar === 'number') {
            stokGeriAlim.push({ ref: uRef, miktar: ud.stokMiktar + adet });
          }
        }
      }

      // Adisyon boşalacaksa ödeme taleplerini de oku (silmek için)
      const odemeSnap = adisyonBosalacak
        ? await tx.get(aRef.collection('odemeTalepleri'))
        : null;

      // ── Yazımlar ───────────────────────────────────────────────────
      tx.delete(sRef);

      for (const g of stokGeriAlim) {
        tx.update(g.ref, { stokMiktar: g.miktar, stoktaMi: true });
      }

      if (adisyonBosalacak) {
        odemeSnap?.docs.forEach((d) => tx.delete(d.ref));
        tx.delete(aRef);
        adisyonSilindi = true;
      } else if (a) {
        tx.update(aRef, {
          toplamKurus: Math.max(0, a.toplamKurus - s.toplamKurus),
          siparisSayisi: yeniSiparisSayisi,
        });
      }
    });

    await auditLogla(u, R, {
      aksiyon: 'siparis.sil',
      kaynak: `adisyonlar/${adisyonId}/siparisler/${siparisId}`,
      meta: { adisyonSilindi },
    });

    return Response.json({ ok: true, adisyonSilindi });
  } catch (e) {
    return httpHata(e);
  }
}

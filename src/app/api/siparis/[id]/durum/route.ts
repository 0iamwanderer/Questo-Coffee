import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { apiKasiyer } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { DurumGirdi } from '@/lib/utils/zod-semalar';
import type { SiparisDurumu } from '@/types/model';

export const runtime = 'nodejs';

const Govde = DurumGirdi.extend({
  adisyonId: z.string().min(1).max(64),
});

const IZIN: Record<SiparisDurumu, SiparisDurumu[]> = {
  yeni: ['hazirlaniyor', 'iptal'],
  hazirlaniyor: ['hazir', 'iptal'],
  hazir: ['teslim'],
  teslim: [],
  iptal: [],
};

const restoranId = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await apiKasiyer();
    const R = restoranId();
    if (u.claims.restoranId !== R) {
      throw new AppError('yetkisiz', 'Restoran kapsamı uyuşmuyor.', 403);
    }

    const { id } = await params;
    const body = Govde.parse(await req.json());

    const db = getAdminDb();
    const sRef = db.doc(
      `restoranlar/${R}/adisyonlar/${body.adisyonId}/siparisler/${id}`,
    );
    const aRef = db.doc(`restoranlar/${R}/adisyonlar/${body.adisyonId}`);

    await db.runTransaction(async (tx) => {
      // Okumalar
      const sSnap = await tx.get(sRef);
      if (!sSnap.exists) {
        throw new AppError('siparis_yok', 'Sipariş bulunamadı.', 404);
      }
      const mevcut = sSnap.data() as {
        durum: SiparisDurumu;
        toplamKurus: number;
      };
      const izin = IZIN[mevcut.durum];
      if (!izin.includes(body.durum)) {
        throw new AppError(
          'gecersiz_durum',
          `${mevcut.durum} → ${body.durum} geçişine izin yok.`,
          400,
        );
      }

      let adisyonGuncelle: {
        toplamKurus: number;
        siparisSayisi: number;
      } | null = null;

      if (body.durum === 'iptal') {
        const aSnap = await tx.get(aRef);
        if (aSnap.exists) {
          const a = aSnap.data() as {
            toplamKurus: number;
            siparisSayisi: number;
          };
          adisyonGuncelle = {
            toplamKurus: Math.max(0, a.toplamKurus - mevcut.toplamKurus),
            siparisSayisi: Math.max(0, a.siparisSayisi - 1),
          };
        }
      }

      // Yazımlar
      tx.update(sRef, {
        durum: body.durum,
        [`durumTarihleri.${body.durum}`]: FieldValue.serverTimestamp(),
      });

      if (adisyonGuncelle) {
        tx.update(aRef, adisyonGuncelle);
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

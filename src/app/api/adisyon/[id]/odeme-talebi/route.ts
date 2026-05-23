import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { MusteriOdemeTalebiIstegi } from '@/lib/utils/zod-semalar';
import { esitOdemeTutariHesapla, odenmisTutarKurus } from '@/lib/siparis/odeme';

export const runtime = 'nodejs';

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      throw new AppError('yetkisiz', 'Kimlik bilgisi eksik.', 401);
    }
    // checkRevoked: revoke edilmiş token'lar reddedilsin
    const decoded = await getAdminAuth().verifyIdToken(
      auth.slice('Bearer '.length).trim(),
      true,
    );

    const body = MusteriOdemeTalebiIstegi.parse(await req.json());
    const { id: adisyonId } = await params;
    const restoranId = R();
    const db = getAdminDb();

    // ── Authz: masaToken → masaId → adisyon.masaId eşleşmeli ─────────────
    const masaSnap = await db
      .collection(`restoranlar/${restoranId}/masalar`)
      .where('token', '==', body.masaToken)
      .where('aktifMi', '==', true)
      .limit(1)
      .get();
    if (masaSnap.empty) {
      throw new AppError('yetkisiz', 'Masa token geçersiz.', 401);
    }
    const masaId = masaSnap.docs[0]!.id;

    const aRef = db.doc(`restoranlar/${restoranId}/adisyonlar/${adisyonId}`);
    const aSnap = await aRef.get();
    if (!aSnap.exists) {
      throw new AppError('adisyon_yok', 'Adisyon bulunamadı.', 404);
    }
    const adisyon = aSnap.data() as {
      durum: string;
      toplamKurus: number;
      masaId: string;
    };
    if (adisyon.masaId !== masaId) {
      throw new AppError('yetkisiz', 'Bu adisyon bu masaya ait değil.', 403);
    }
    if (adisyon.durum !== 'acik') {
      throw new AppError('adisyon_kapali', 'Adisyon açık değil.', 409);
    }

    // ── Tutar hesaplama (kalan-farkındalı) ──────────────────────────────
    const odenmis = await odenmisTutarKurus(aRef);
    const kalan = Math.max(0, adisyon.toplamKurus - odenmis);
    if (kalan <= 0) {
      throw new AppError(
        'tamamen_odendi',
        'Adisyon zaten tamamen ödenmiş.',
        409,
      );
    }

    let toplamKurus: number;
    let extra: Record<string, unknown> = {};

    if (body.yontem === 'tam') {
      toplamKurus = kalan;
    } else if (body.yontem === 'esit') {
      toplamKurus = esitOdemeTutariHesapla(
        adisyon.toplamKurus,
        body.kisiSayisi,
        kalan,
      );
      extra = { kisiSayisi: body.kisiSayisi, kisiPayi: toplamKurus };
    } else {
      const secimToplam = body.secilenKalemler.reduce(
        (acc, k) => acc + k.araToplamKurus,
        0,
      );
      // Seçilen kalemler tutarı kalan'dan fazlaysa overpay olmasın
      toplamKurus = Math.min(secimToplam, kalan);
      extra = { secilenKalemler: body.secilenKalemler };
    }

    const talepRef = aRef.collection('odemeTalepleri').doc();
    await talepRef.set({
      adisyonId,
      musteriUid: decoded.uid,
      yontem: body.yontem,
      toplamKurus,
      ...extra,
      ...(body.musteriAd ? { musteriAd: body.musteriAd } : {}),
      durum: 'bekliyor',
      kaynak: 'musteri',
      olusturulduAt: FieldValue.serverTimestamp(),
    });

    return Response.json({
      ok: true,
      talepId: talepRef.id,
      toplamKurus,
      ...(extra.kisiPayi !== undefined && { kisiPayi: extra.kisiPayi }),
    });
  } catch (e) {
    return httpHata(e);
  }
}

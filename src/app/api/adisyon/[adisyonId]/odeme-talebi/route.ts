import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';
import { OdemeTalebiIstegi } from '@/lib/utils/zod-semalar';

export const runtime = 'nodejs';

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ adisyonId: string }> },
) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      throw new AppError('yetkisiz', 'Kimlik bilgisi eksik.', 401);
    }
    const decoded = await getAdminAuth().verifyIdToken(
      auth.slice('Bearer '.length).trim(),
    );

    const body = OdemeTalebiIstegi.parse(await req.json());
    const { adisyonId } = await params;
    const restoranId = R();
    const db = getAdminDb();

    const aRef = db.doc(`restoranlar/${restoranId}/adisyonlar/${adisyonId}`);
    const aSnap = await aRef.get();
    if (!aSnap.exists) {
      throw new AppError('adisyon_yok', 'Adisyon bulunamadı.', 404);
    }
    const adisyon = aSnap.data() as { durum: string; toplamKurus: number };
    if (adisyon.durum !== 'acik') {
      throw new AppError('adisyon_kapali', 'Adisyon açık değil.', 409);
    }

    let toplamKurus: number;
    let extra: Record<string, unknown> = {};

    if (body.yontem === 'esit') {
      toplamKurus = adisyon.toplamKurus;
      const kisiPayi = Math.ceil(toplamKurus / body.kisiSayisi);
      extra = { kisiSayisi: body.kisiSayisi, kisiPayi };
    } else {
      toplamKurus = body.secilenKalemler.reduce(
        (acc, k) => acc + k.araToplamKurus,
        0,
      );
      extra = { secilenKalemler: body.secilenKalemler };
    }

    const talepRef = aRef.collection('odemeTalepleri').doc();
    await talepRef.set({
      adisyonId,
      musteriUid: decoded.uid,
      yontem: body.yontem,
      toplamKurus,
      ...extra,
      durum: 'bekliyor',
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

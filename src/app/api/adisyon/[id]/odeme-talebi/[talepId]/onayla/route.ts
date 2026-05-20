import { apiKasiyer } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';

export const runtime = 'nodejs';

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; talepId: string }> },
) {
  try {
    const u = await apiKasiyer();
    const restoranId = R();
    if (u.claims.restoranId !== restoranId) {
      throw new AppError('yetkisiz', 'Restoran kapsamı uyuşmuyor.', 403);
    }

    const { id: adisyonId, talepId } = await params;
    const db = getAdminDb();

    const talepRef = db.doc(
      `restoranlar/${restoranId}/adisyonlar/${adisyonId}/odemeTalepleri/${talepId}`,
    );
    const talepSnap = await talepRef.get();
    if (!talepSnap.exists) {
      throw new AppError('talep_yok', 'Ödeme talebi bulunamadı.', 404);
    }
    const talep = talepSnap.data() as { durum: string };
    if (talep.durum !== 'bekliyor') {
      throw new AppError('talep_islendi', 'Bu talep zaten işlenmiş.', 409);
    }

    await talepRef.update({ durum: 'odendi' });
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

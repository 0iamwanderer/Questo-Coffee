import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase/admin';
import { cerezAyarla, oturumCereziUret } from '@/lib/auth/session';
import { AppError, httpHata } from '@/lib/utils/hata';

const Govde = z.object({
  idToken: z.string().min(20),
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = Govde.parse(await req.json());

    // İlk olarak ID token'ı doğrula ve claim'leri kontrol et
    const decoded = await getAdminAuth().verifyIdToken(body.idToken, true);
    if (decoded.rol !== 'kasiyer') {
      throw new AppError(
        'yetkisiz',
        'Bu hesabın kasiyer yetkisi yok.',
        403,
      );
    }

    const cookie = await oturumCereziUret(body.idToken);
    await cerezAyarla(cookie);

    return Response.json({
      ok: true,
      sahip: decoded.sahip === true,
    });
  } catch (e) {
    return httpHata(e);
  }
}

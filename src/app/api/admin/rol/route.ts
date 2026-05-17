import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase/admin';
import { AppError, httpHata } from '@/lib/utils/hata';

const Govde = z.object({
  setupToken: z.string().min(8).max(200),
  email: z.string().email(),
  sahip: z.boolean().default(true),
});

export const runtime = 'nodejs';

/**
 * Tek kullanımlık kurulum endpoint'i.
 * ADMIN_SETUP_TOKEN ortam değişkeni ile korunur — kurulum sonrası
 * tokenı sıfırlamak (env'den silmek) önerilir.
 *
 * curl -X POST /api/admin/rol \
 *   -H 'content-type: application/json' \
 *   -d '{"setupToken":"...","email":"sahip@kafem.com","sahip":true}'
 */
export async function POST(req: Request) {
  try {
    const setupExp = process.env.ADMIN_SETUP_TOKEN;
    const restoranId = process.env.NEXT_PUBLIC_RESTORAN_ID;

    if (!setupExp || !restoranId) {
      throw new AppError(
        'yapilandirma',
        'ADMIN_SETUP_TOKEN veya NEXT_PUBLIC_RESTORAN_ID tanımlı değil.',
        500,
      );
    }

    const body = Govde.parse(await req.json());
    if (body.setupToken !== setupExp) {
      throw new AppError('yetkisiz', 'Setup token geçersiz.', 401);
    }

    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(body.email);

    await auth.setCustomUserClaims(user.uid, {
      rol: 'kasiyer',
      sahip: body.sahip,
      restoranId,
    });

    // Kullanıcı bir sonraki login'de claim'leri yenilemiş ID token alacak.
    return Response.json({ ok: true, uid: user.uid, sahip: body.sahip });
  } catch (e) {
    return httpHata(e);
  }
}

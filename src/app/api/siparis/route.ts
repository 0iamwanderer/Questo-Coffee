import { getAdminAuth } from '@/lib/firebase/admin';
import { siparisYaz } from '@/lib/siparis/servis';
import { AppError, httpHata } from '@/lib/utils/hata';
import { SiparisIstegi } from '@/lib/utils/zod-semalar';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = SiparisIstegi.parse(await req.json());

    // Authorization: Bearer <Firebase ID token> (Anon Auth)
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      throw new AppError('yetkisiz', 'Kimlik bilgisi eksik.', 401);
    }
    const idToken = auth.slice('Bearer '.length).trim();
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const sonuc = await siparisYaz(body, decoded.uid);
    return Response.json({ ok: true, ...sonuc });
  } catch (e) {
    return httpHata(e);
  }
}

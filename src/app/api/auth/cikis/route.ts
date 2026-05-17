import { cerezSil } from '@/lib/auth/session';
import { httpHata } from '@/lib/utils/hata';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await cerezSil();
    // Form submission ile gelen istek için 303 → /kasa/giris
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return Response.redirect(new URL('/kasa/giris', req.url), 303);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return httpHata(e);
  }
}

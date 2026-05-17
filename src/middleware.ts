import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_ADI } from '@/lib/auth/cookie';

// Yalnızca cookie varlığını kontrol eder. Cookie içeriğinin geçerliliği
// (imza + revoke kontrolü) ilgili sayfanın server guard'ında yapılır;
// edge runtime'da firebase-admin çalıştırılamaz.

const ACIK_YOLLAR = ['/kasa/giris'];

export function middleware(req: NextRequest) {
  const yol = req.nextUrl.pathname;

  if (ACIK_YOLLAR.includes(yol)) {
    return NextResponse.next();
  }

  const cerez = req.cookies.get(COOKIE_ADI)?.value;
  if (!cerez) {
    const url = req.nextUrl.clone();
    url.pathname = '/kasa/giris';
    url.searchParams.set('geri', yol);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/kasa/:path*', '/admin/:path*'],
};

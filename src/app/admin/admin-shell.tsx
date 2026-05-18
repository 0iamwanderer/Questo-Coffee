'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { yol: '/admin/menu', etiket: 'Menü' },
  { yol: '/admin/masalar', etiket: 'Masalar' },
  { yol: '/admin/masalar/qr', etiket: 'QR PDF' },
  { yol: '/admin/rapor', etiket: 'Rapor' },
  { yol: '/admin/ayarlar', etiket: 'Ayarlar' },
];

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const yol = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/menu"
              className="flex items-center gap-2 font-semibold"
            >
              <span className="relative size-7 overflow-hidden rounded-full">
                <Image
                  src="/logo.jpg"
                  alt="Questo"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </span>
              <span className="font-serif">Questo · Yönetim</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.yol}
                  href={n.yol}
                  className={cn(
                    'rounded-md px-2.5 py-1',
                    yol === n.yol
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {n.etiket}
                </Link>
              ))}
              <Link
                href="/kasa"
                className="rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground"
              >
                Kasaya dön
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {email}
              </span>
            )}
            <form action="/api/auth/cikis" method="post">
              <button
                type="submit"
                className="text-xs underline text-muted-foreground"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

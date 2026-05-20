'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [menuAcik, setMenuAcik] = useState(false);

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
            <nav className="hidden items-center gap-1 text-sm sm:flex">
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
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground sm:hidden"
              onClick={() => setMenuAcik((v) => !v)}
              aria-label="Menüyü aç/kapat"
            >
              {menuAcik ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuAcik && (
          <nav className="flex flex-col gap-1 border-t bg-background px-4 py-2 text-sm sm:hidden">
            {NAV.map((n) => (
              <Link
                key={n.yol}
                href={n.yol}
                onClick={() => setMenuAcik(false)}
                className={cn(
                  'rounded-md px-3 py-2',
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
              onClick={() => setMenuAcik(false)}
              className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Kasaya dön
            </Link>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';
import { BaglantiRozeti } from '@/components/kasa/baglanti-rozeti';
import { VardiyaBaslat } from '@/components/kasa/vardiya-baslat';
import { cn } from '@/lib/utils';

interface Props {
  kullanici: { email: string | null; sahip: boolean };
  children: React.ReactNode;
}

const NAV = [
  { yol: '/kasa', etiket: 'Kanban' },
  { yol: '/kasa/adisyonlar', etiket: 'Adisyonlar' },
];

export function KasaShell({ kullanici, children }: Props) {
  const yol = usePathname();
  const [authHazir, setAuthHazir] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(getClientAuth(), (u) => {
      setAuthHazir(!!u);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-4">
            <Link href="/kasa" className="flex items-center gap-2 font-semibold">
              <span className="relative size-7 overflow-hidden rounded-full">
                <Image
                  src="/logo.png"
                  alt="Questo"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </span>
              <span className="font-serif">Questo · Kasa</span>
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
              {kullanici.sahip && (
                <Link
                  href="/admin/menu"
                  className="rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground"
                >
                  Yönetim
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <BaglantiRozeti />
            {kullanici.email && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {kullanici.email}
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

      <VardiyaBaslat />

      {!authHazir && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30">
            Firebase oturumu yükleniyor… Görünmüyorsa lütfen{' '}
            <Link href="/kasa/giris" className="underline">
              tekrar giriş yapın
            </Link>
            .
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

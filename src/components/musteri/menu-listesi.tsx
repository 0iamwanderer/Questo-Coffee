'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import {
  kategoriConverter,
  urunConverter,
} from '@/lib/firebase/converters';
import type { Kategori, Urun } from '@/types/model';
import { UrunKarti } from './urun-karti';
import { UrunDetaySheet } from './urun-detay-sheet';
import { MenuSkeleton } from './urun-karti-skeleton';
import { cn } from '@/lib/utils';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

export function MenuListesi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [aktifKategori, setAktifKategori] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [detayUrun, setDetayUrun] = useState<Urun | null>(null);

  useEffect(() => {
    const db = getClientDb();
    const kQ = query(
      collection(db, `restoranlar/${RESTORAN}/kategoriler`).withConverter(
        kategoriConverter,
      ),
      where('aktifMi', '==', true),
      orderBy('sira', 'asc'),
    );
    const uQ = query(
      collection(db, `restoranlar/${RESTORAN}/urunler`).withConverter(
        urunConverter,
      ),
      orderBy('sira', 'asc'),
    );

    const u1 = onSnapshot(kQ, (snap) => {
      setKategoriler(snap.docs.map((d) => d.data()));
      setYukleniyor(false);
    });
    const u2 = onSnapshot(uQ, (snap) => {
      setUrunler(snap.docs.map((d) => d.data()));
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!aktifKategori && kategoriler[0]) {
      setAktifKategori(kategoriler[0].id);
    }
  }, [kategoriler, aktifKategori]);

  const aktifIndeks = useMemo(
    () => kategoriler.findIndex((k) => k.id === aktifKategori),
    [kategoriler, aktifKategori],
  );

  const goruntulenenUrunler = useMemo(
    () =>
      aktifKategori
        ? urunler.filter((u) => u.kategoriId === aktifKategori)
        : urunler,
    [urunler, aktifKategori],
  );

  if (yukleniyor) {
    return <MenuSkeleton />;
  }

  if (kategoriler.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Henüz menü hazırlanmamış.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kategori pill sekmeleri — sticky */}
      <nav
        className="sticky top-0 z-10 -mx-4 bg-background/85 px-4 pt-2 pb-1 backdrop-blur-md"
        aria-label="Kategoriler"
      >
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kategoriler.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => setAktifKategori(k.id)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition active:scale-[0.97]',
                  aktifKategori === k.id
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {k.ad}
              </button>
            </li>
          ))}
        </ul>
        {/* Dot indicator */}
        <div className="mt-1.5 flex justify-center gap-1">
          {kategoriler.map((k, i) => (
            <span
              key={k.id}
              className={cn(
                'h-1 rounded-full bg-foreground/30 transition-all',
                i === aktifIndeks ? 'w-4 bg-foreground/70' : 'w-1',
              )}
            />
          ))}
        </div>
      </nav>

      <div
        key={aktifKategori ?? 'all'}
        className="anim-fade-in divide-y divide-border"
      >
        {goruntulenenUrunler.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Bu kategoride ürün yok.
          </p>
        ) : (
          goruntulenenUrunler.map((u) => (
            <UrunKarti key={u.id} urun={u} onDetay={setDetayUrun} />
          ))
        )}
      </div>

      <UrunDetaySheet
        urun={detayUrun}
        acik={!!detayUrun}
        onKapat={() => setDetayUrun(null)}
      />
    </div>
  );
}

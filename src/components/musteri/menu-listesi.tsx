'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import {
  kategoriConverter,
  urunConverter,
} from '@/lib/firebase/converters';
import type { Kategori, Urun } from '@/types/model';
import { UrunKarti } from './urun-karti';
import { cn } from '@/lib/utils';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

export function MenuListesi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [aktifKategori, setAktifKategori] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

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

  const goruntulenenUrunler = useMemo(
    () =>
      aktifKategori
        ? urunler.filter((u) => u.kategoriId === aktifKategori)
        : urunler,
    [urunler, aktifKategori],
  );

  if (yukleniyor) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Menü yükleniyor…
      </div>
    );
  }

  if (kategoriler.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Henüz menü hazırlanmamış.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav
        className="sticky top-0 z-10 -mx-4 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur"
        aria-label="Kategoriler"
      >
        <ul className="flex gap-2">
          {kategoriler.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => setAktifKategori(k.id)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition',
                  aktifKategori === k.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground',
                )}
              >
                {k.ad}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-2">
        {goruntulenenUrunler.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Bu kategoride ürün yok.
          </p>
        ) : (
          goruntulenenUrunler.map((u) => <UrunKarti key={u.id} urun={u} />)
        )}
      </div>
    </div>
  );
}

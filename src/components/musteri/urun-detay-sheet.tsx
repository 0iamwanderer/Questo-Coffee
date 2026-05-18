'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Urun, UrunOpsiyonGrubu } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet, type SepetSecim } from '@/stores/sepet';
import { cn } from '@/lib/utils';
import { flyToCart } from './sepete-uc';

interface Props {
  urun: Urun | null;
  acik: boolean;
  onKapat: () => void;
}

function DetayGorseli({ urun }: { urun: Urun }) {
  if (urun.gorselUrl) {
    return (
      <Image
        src={urun.gorselUrl}
        alt={urun.ad}
        fill
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover"
      />
    );
  }
  const harf = urun.ad.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex h-full w-full items-center justify-center font-serif text-7xl text-primary/60"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
      }}
    >
      {harf}
    </div>
  );
}

export function UrunDetaySheet({ urun, acik, onKapat }: Props) {
  const [render, setRender] = useState(acik);
  const [kapaniyor, setKapaniyor] = useState(false);
  const [secimler, setSecimler] = useState<Record<string, string[]>>({});
  const gorselRef = useRef<HTMLDivElement>(null);

  const ekle = useSepet((s) => s.ekle);

  // Sheet açıldığında varsayılan seçimleri kur (tek+zorunlu için ilk seçenek)
  useEffect(() => {
    if (!acik || !urun) return;
    const def: Record<string, string[]> = {};
    for (const grup of urun.opsiyonGruplari ?? []) {
      if (grup.tip === 'tek' && grup.zorunlu && grup.secenekler[0]) {
        def[grup.id] = [grup.secenekler[0].id];
      } else {
        def[grup.id] = [];
      }
    }
    setSecimler(def);
  }, [acik, urun]);

  useEffect(() => {
    if (acik) {
      setRender(true);
      setKapaniyor(false);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [acik]);

  const opsiyonlu = (urun?.opsiyonGruplari?.length ?? 0) > 0;

  const ekFiyat = useMemo(() => {
    if (!urun) return 0;
    let toplam = 0;
    for (const grup of urun.opsiyonGruplari ?? []) {
      const seciliIds = secimler[grup.id] ?? [];
      for (const id of seciliIds) {
        const sec = grup.secenekler.find((s) => s.id === id);
        if (sec) toplam += sec.ekFiyatKurus;
      }
    }
    return toplam;
  }, [urun, secimler]);

  const eksikZorunlu = useMemo(() => {
    if (!urun) return false;
    return (urun.opsiyonGruplari ?? []).some(
      (g) => g.zorunlu && (secimler[g.id] ?? []).length === 0,
    );
  }, [urun, secimler]);

  if (!render || !urun) return null;

  const stokYok = !urun.stoktaMi;
  const birimFiyat = urun.fiyatKurus + ekFiyat;

  const kapat = () => {
    setKapaniyor(true);
    setTimeout(() => {
      setRender(false);
      setKapaniyor(false);
      onKapat();
    }, 240);
  };

  const tekDegistir = (grupId: string, secenekId: string) => {
    setSecimler((prev) => ({ ...prev, [grupId]: [secenekId] }));
  };

  const cokDegistir = (grupId: string, secenekId: string) => {
    setSecimler((prev) => {
      const mevcut = prev[grupId] ?? [];
      const yeni = mevcut.includes(secenekId)
        ? mevcut.filter((id) => id !== secenekId)
        : [...mevcut, secenekId];
      return { ...prev, [grupId]: yeni };
    });
  };

  const sepeteEkle = () => {
    if (!urun) return;
    if (eksikZorunlu) {
      toast.error('Zorunlu seçimleri yapın.');
      return;
    }
    const secimDizisi: SepetSecim[] = Object.entries(secimler)
      .filter(([, ids]) => ids.length > 0)
      .map(([grupId, secenekIds]) => ({ grupId, secenekIds }));

    // Sheet'in görselinin rect'ini kapanmadan al
    const rect = gorselRef.current?.getBoundingClientRect();

    ekle(urun.id, {
      ...(secimDizisi.length > 0 ? { secimler: secimDizisi } : {}),
    });

    // Sheet kapanma animasyonu sırasında uçur (görsel hâlâ ekranda)
    if (rect) {
      requestAnimationFrame(() => {
        flyToCart({
          fromRect: rect,
          imgUrl: urun.gorselUrl,
          harf: urun.ad.charAt(0),
        });
      });
    }
    kapat();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={urun.ad}
      className="fixed inset-0 z-40 flex items-end justify-center"
    >
      <button
        type="button"
        onClick={kapat}
        aria-label="Kapat"
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity',
          kapaniyor ? 'opacity-0' : 'opacity-100',
        )}
        style={{ transitionDuration: kapaniyor ? '240ms' : '380ms' }}
      />

      <div
        className={cn(
          'relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card shadow-floating',
          kapaniyor ? 'anim-sheet-out' : 'anim-sheet-in',
        )}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-card/95 pt-3 pb-1 backdrop-blur">
          <div className="h-1.5 w-10 rounded-full bg-foreground/15" />
        </div>

        <div
          ref={gorselRef}
          className="relative h-56 w-full overflow-hidden bg-muted/40"
        >
          <DetayGorseli urun={urun} />
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-6 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-accent px-2.5 py-1 micro-caps text-accent-foreground">
              Günlük taze
            </span>
            <span className="rounded-full border px-2.5 py-1 micro-caps text-muted-foreground">
              KDV dahil
            </span>
            {stokYok && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 micro-caps text-destructive">
                Stokta yok
              </span>
            )}
          </div>

          <header className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-3xl leading-tight">{urun.ad}</h2>
            <div className="text-right">
              <FiyatGoster fiyat={birimFiyat} />
              {ekFiyat > 0 && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  baz {formatTL(urun.fiyatKurus)} + {formatTL(ekFiyat)}
                </div>
              )}
            </div>
          </header>

          {urun.aciklama && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {urun.aciklama}
            </p>
          )}

          {/* Opsiyon grupları */}
          {opsiyonlu && (
            <div className="space-y-4 border-t pt-4">
              {urun.opsiyonGruplari!.map((grup) => (
                <OpsiyonGrubu
                  key={grup.id}
                  grup={grup}
                  secili={secimler[grup.id] ?? []}
                  onTek={(id) => tekDegistir(grup.id, id)}
                  onCok={(id) => cokDegistir(grup.id, id)}
                />
              ))}
            </div>
          )}

          {!stokYok ? (
            <button
              type="button"
              onClick={sepeteEkle}
              disabled={eksikZorunlu}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-50"
            >
              Sepete ekle · {formatTL(birimFiyat)}
            </button>
          ) : (
            <div className="rounded-lg border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Bu ürün şu anda stokta yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Fiyat değiştiğinde küçük pop animasyonu (boy/ekstra seçimi sonucu)
function FiyatGoster({ fiyat }: { fiyat: number }) {
  const [animKey, setAnimKey] = useState(0);
  const oncekiFiyat = useRef(fiyat);
  useEffect(() => {
    if (oncekiFiyat.current !== fiyat) {
      oncekiFiyat.current = fiyat;
      setAnimKey((k) => k + 1);
    }
  }, [fiyat]);
  return (
    <div
      key={animKey}
      className="anim-pop font-serif text-2xl leading-none tabular-nums"
    >
      {formatTL(fiyat)}
    </div>
  );
}

function OpsiyonGrubu({
  grup,
  secili,
  onTek,
  onCok,
}: {
  grup: UrunOpsiyonGrubu;
  secili: string[];
  onTek: (id: string) => void;
  onCok: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{grup.ad}</h3>
        <span className="micro-caps text-muted-foreground">
          {grup.zorunlu
            ? 'Zorunlu'
            : grup.tip === 'tek'
              ? 'Tek seçim'
              : 'Çoklu'}
        </span>
      </div>
      <ul className="space-y-1.5">
        {grup.secenekler.map((sec) => {
          const aktif = secili.includes(sec.id);
          return (
            <li key={sec.id}>
              <button
                type="button"
                onClick={() =>
                  grup.tip === 'tek' ? onTek(sec.id) : onCok(sec.id)
                }
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                  aktif
                    ? 'border-foreground bg-foreground/[0.04]'
                    : 'border-border bg-card',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex size-4 shrink-0 items-center justify-center',
                      grup.tip === 'tek'
                        ? 'rounded-full border-2'
                        : 'rounded border-2',
                      aktif
                        ? 'border-foreground bg-foreground'
                        : 'border-border',
                    )}
                  >
                    {aktif && grup.tip === 'tek' && (
                      <span className="size-1.5 rounded-full bg-background" />
                    )}
                    {aktif && grup.tip === 'cok' && (
                      <svg
                        viewBox="0 0 14 14"
                        className="size-2.5 text-background"
                        fill="none"
                      >
                        <path
                          d="M3 7.2 5.8 10 11 4.2"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {sec.ad}
                </span>
                {sec.ekFiyatKurus > 0 && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    +{formatTL(sec.ekFiyatKurus)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

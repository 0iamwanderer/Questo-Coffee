'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { cn } from '@/lib/utils';

interface Props {
  urun: Urun | null;
  acik: boolean;
  onKapat: () => void;
}

// Görsel yoksa harf+gradient placeholder
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

  const ekle = useSepet((s) => s.ekle);
  const adetGetir = useSepet((s) => s.adetGetir);
  const guncelle = useSepet((s) => s.guncelle);

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

  if (!render || !urun) return null;

  const adet = adetGetir(urun.id);
  const stokYok = !urun.stoktaMi;

  const kapat = () => {
    setKapaniyor(true);
    setTimeout(() => {
      setRender(false);
      setKapaniyor(false);
      onKapat();
    }, 240);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={urun.ad}
      className="fixed inset-0 z-40 flex items-end justify-center"
    >
      {/* Backdrop */}
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

      {/* Sheet */}
      <div
        className={cn(
          'relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card shadow-floating',
          kapaniyor ? 'anim-sheet-out' : 'anim-sheet-in',
        )}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-card/95 pt-2 pb-1 backdrop-blur">
          <div className="h-1 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* Görsel */}
        <div className="relative h-64 w-full overflow-hidden bg-muted/40">
          <DetayGorseli urun={urun} />
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="space-y-4 px-5 pb-6 pt-4">
          <header className="space-y-1">
            <h2 className="font-serif text-3xl leading-tight">{urun.ad}</h2>
            <p className="text-base font-semibold tabular-nums">
              {formatTL(urun.fiyatKurus)}
            </p>
          </header>

          {urun.aciklama && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {urun.aciklama}
            </p>
          )}

          {stokYok && (
            <div className="rounded-lg border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Bu ürün şu anda stokta yok.
            </div>
          )}

          {/* Adet & ekle */}
          {!stokYok && (
            <div className="flex items-center gap-3 pt-2">
              {adet === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    ekle(urun.id);
                    kapat();
                  }}
                  className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98]"
                >
                  Sepete ekle · {formatTL(urun.fiyatKurus)}
                </button>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1 rounded-full border bg-background px-1">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => guncelle(urun.id, adet - 1)}
                      className="rounded-full p-2 transition active:scale-90"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-6 text-center text-base font-medium tabular-nums">
                      {adet}
                    </span>
                    <button
                      type="button"
                      aria-label="Arttır"
                      onClick={() => guncelle(urun.id, adet + 1)}
                      className="rounded-full p-2 transition active:scale-90"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={kapat}
                    className="flex-1 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background shadow-soft transition active:scale-[0.98]"
                  >
                    Tamam ·{' '}
                    {formatTL(urun.fiyatKurus * adet)}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

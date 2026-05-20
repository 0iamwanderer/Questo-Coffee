'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Minus, Plus, Sparkles } from 'lucide-react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { flyToCart } from './sepete-uc';

interface Props {
  urun: Urun;
  onDetay?: (urun: Urun) => void;
}

function VitrinGorseli({ urun }: { urun: Urun }) {
  if (urun.gorselUrl) {
    return (
      <Image
        src={urun.gorselUrl}
        alt={urun.ad}
        fill
        sizes="140px"
        className="object-cover"
      />
    );
  }
  const harf = urun.ad.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex h-full w-full items-center justify-center font-serif text-6xl text-primary/60"
      style={{
        background:
          'radial-gradient(70% 60% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
      }}
    >
      {harf}
    </div>
  );
}

export function VitrinKarti({ urun, onDetay }: Props) {
  const ekle = useSepet((s) => s.ekle);
  const guncelle = useSepet((s) => s.guncelle);
  const kalemler = useSepet((s) => s.kalemler);
  const gorselRef = useRef<HTMLButtonElement>(null);

  const opsiyonlu = (urun.opsiyonGruplari?.length ?? 0) > 0;
  const stokYok = !urun.stoktaMi;
  const tekSatir = !opsiyonlu
    ? kalemler.find((k) => k.urunId === urun.id && !k.secimler)
    : undefined;

  const hizliEkle = () => {
    ekle(urun.id);
    requestAnimationFrame(() => {
      if (!gorselRef.current) return;
      flyToCart({
        fromRect: gorselRef.current.getBoundingClientRect(),
        imgUrl: urun.gorselUrl,
        harf: urun.ad.charAt(0),
      });
    });
  };

  return (
    <article
      className="relative my-4 overflow-hidden rounded-3xl border-2 border-primary/30 bg-card shadow-soft"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--accent) / 0.45) 100%)',
      }}
    >
      {/* Köşede dekoratif çekirdek */}
      <svg
        aria-hidden
        viewBox="0 0 60 60"
        className="pointer-events-none absolute -right-3 -top-3 size-24 text-primary/10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <ellipse cx="30" cy="30" rx="14" ry="20" transform="rotate(-30 30 30)" />
        <path d="M22 30 L38 26" transform="rotate(-30 30 30)" />
      </svg>

      <div className="relative flex gap-4 p-4">
        {/* Görsel */}
        <button
          ref={gorselRef}
          type="button"
          onClick={() => onDetay?.(urun)}
          className="relative size-32 shrink-0 overflow-hidden rounded-2xl border bg-muted/40 shadow-soft transition active:scale-[0.98]"
          aria-label={`${urun.ad} detayı`}
        >
          <VitrinGorseli urun={urun} />
        </button>

        {/* İçerik */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" />
            <span className="micro-caps text-primary">Şefin önerisi</span>
          </div>
          <h3
            className="mt-1 font-serif text-2xl leading-tight"
            onClick={() => onDetay?.(urun)}
            role={onDetay ? 'button' : undefined}
          >
            {urun.ad}
          </h3>
          {urun.aciklama && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {urun.aciklama}
            </p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="font-serif text-2xl tabular-nums">
              {formatTL(urun.fiyatKurus)}
            </span>
            {!stokYok && (
              <div onClick={(e) => e.stopPropagation()}>
                {opsiyonlu ? (
                  <button
                    type="button"
                    onClick={() => onDetay?.(urun)}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-soft transition active:scale-[0.96]"
                  >
                    Seç
                  </button>
                ) : tekSatir ? (
                  <div className="inline-flex items-center gap-1 rounded-full border bg-card px-1 shadow-soft">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => guncelle(tekSatir.satirId, tekSatir.adet - 1)}
                      className="rounded-full p-1.5 transition active:scale-[0.92]"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-5 text-center text-sm font-medium tabular-nums">
                      {tekSatir.adet}
                    </span>
                    <button
                      type="button"
                      aria-label="Artır"
                      onClick={hizliEkle}
                      className="rounded-full p-1.5 transition active:scale-[0.92]"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={hizliEkle}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-soft transition active:scale-[0.96]"
                  >
                    Sepete ekle
                  </button>
                )}
              </div>
            )}
            {stokYok && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Stokta yok
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

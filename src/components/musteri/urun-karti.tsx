'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Minus, Plus, Sliders, Sparkles } from 'lucide-react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { cn } from '@/lib/utils';
import { flyToCart } from './sepete-uc';

interface Props {
  urun: Urun;
  onDetay?: (urun: Urun) => void;
}

function UrunGorseli({ urun }: { urun: Urun }) {
  if (urun.gorselUrl) {
    return (
      <Image
        src={urun.gorselUrl}
        alt={urun.ad}
        fill
        sizes="96px"
        className="object-cover"
      />
    );
  }
  const harf = urun.ad.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex h-full w-full items-center justify-center font-serif text-3xl text-primary/70"
      style={{
        background:
          'radial-gradient(70% 60% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
      }}
    >
      {harf}
    </div>
  );
}

export function UrunKarti({ urun, onDetay }: Props) {
  const adet = useSepet((s) => s.adetGetir(urun.id));
  const ekle = useSepet((s) => s.ekle);
  const guncelle = useSepet((s) => s.guncelle);
  const kalemler = useSepet((s) => s.kalemler);
  const gorselRef = useRef<HTMLButtonElement>(null);

  const stokYok = !urun.stoktaMi;
  const opsiyonlu = (urun.opsiyonGruplari?.length ?? 0) > 0;

  const sepeteEkleAnimasyonlu = () => {
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

  // Opsiyonsuz ürünün sepetteki tek satırı (varsa)
  const tekSatir =
    !opsiyonlu
      ? kalemler.find((k) => k.urunId === urun.id && !k.secimler)
      : undefined;

  return (
    <article
      className={cn(
        'group flex items-start gap-3 py-4 transition-transform',
        stokYok && 'opacity-55',
        !stokYok && 'hover:-translate-y-px',
      )}
    >
      <button
        ref={gorselRef}
        type="button"
        onClick={() => onDetay?.(urun)}
        className="relative size-24 shrink-0 overflow-hidden rounded-2xl border bg-muted/40 shadow-soft transition active:scale-[0.97] group-hover:shadow-md"
        aria-label={`${urun.ad} detayı`}
        disabled={!onDetay}
      >
        <UrunGorseli urun={urun} />
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onDetay?.(urun)}
        role={onDetay ? 'button' : undefined}
      >
        <h3 className="font-serif text-lg leading-tight">{urun.ad}</h3>
        {urun.aciklama && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {urun.aciklama}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">
            {formatTL(urun.fiyatKurus)}
          </span>
          {urun.sefOnerisi && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              <Sparkles className="size-2.5" />
              şefin önerisi
            </span>
          )}
          {(() => {
            // Son 7 gün içinde eklenen ürün için "Yeni" rozeti
            const olusturma =
              (urun as Urun & { olusturulduAt?: Date }).olusturulduAt;
            const yedi = 7 * 24 * 60 * 60 * 1000;
            const yeniMi =
              olusturma instanceof Date &&
              Date.now() - olusturma.getTime() < yedi;
            return yeniMi ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Yeni
              </span>
            ) : null;
          })()}
          {opsiyonlu && (
            <span className="inline-flex items-center gap-0.5 rounded-full border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
              <Sliders className="size-2.5" />
              seçenekli
            </span>
          )}
          {!stokYok &&
            typeof urun.stokMiktar === 'number' &&
            urun.stokMiktar > 0 &&
            urun.stokMiktar <= 5 && (
              <span className="anim-pulse-soft rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Son {urun.stokMiktar}
              </span>
            )}
          {stokYok && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Stokta yok
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
        {stokYok ? null : opsiyonlu ? (
          <button
            type="button"
            onClick={() => onDetay?.(urun)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft transition active:scale-[0.96]"
          >
            Seç
            {adet > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[10px] tabular-nums">
                {adet}
              </span>
            )}
          </button>
        ) : tekSatir ? (
          <div className="inline-flex items-center gap-1 rounded-full border bg-card px-1 shadow-soft">
            <button
              type="button"
              aria-label="Azalt"
              onClick={() =>
                guncelle(tekSatir.satirId, tekSatir.adet - 1)
              }
              className="rounded-full p-1.5 transition active:scale-[0.92]"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-5 text-center text-sm font-medium tabular-nums">
              {tekSatir.adet}
            </span>
            <button
              type="button"
              aria-label="Arttır"
              onClick={sepeteEkleAnimasyonlu}
              className="rounded-full p-1.5 transition active:scale-[0.92]"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={sepeteEkleAnimasyonlu}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-soft transition active:scale-[0.96]"
          >
            Ekle
          </button>
        )}
      </div>
    </article>
  );
}

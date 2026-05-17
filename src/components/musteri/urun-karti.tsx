'use client';

import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { cn } from '@/lib/utils';

interface Props {
  urun: Urun;
  onDetay?: (urun: Urun) => void;
}

// Görsel yoksa serif monogram ile gradient swatch (prototipten ödünç)
function UrunGorseli({ urun }: { urun: Urun }) {
  if (urun.gorselUrl) {
    return (
      <Image
        src={urun.gorselUrl}
        alt={urun.ad}
        fill
        sizes="84px"
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

  const stokYok = !urun.stoktaMi;

  return (
    <article
      className={cn(
        'group flex items-start gap-3 py-3',
        stokYok && 'opacity-55',
      )}
    >
      <button
        type="button"
        onClick={() => onDetay?.(urun)}
        className="relative size-20 shrink-0 overflow-hidden rounded-2xl border bg-muted/40 shadow-soft transition active:scale-[0.98]"
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
          {stokYok && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Stokta yok
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
        {stokYok ? null : adet === 0 ? (
          <button
            type="button"
            onClick={() => ekle(urun.id)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-soft transition active:scale-[0.96]"
          >
            Ekle
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-full border bg-card px-1 shadow-soft">
            <button
              type="button"
              aria-label="Azalt"
              onClick={() => guncelle(urun.id, adet - 1)}
              className="rounded-full p-1.5 transition active:scale-[0.92]"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-5 text-center text-sm font-medium tabular-nums">
              {adet}
            </span>
            <button
              type="button"
              aria-label="Arttır"
              onClick={() => guncelle(urun.id, adet + 1)}
              className="rounded-full p-1.5 transition active:scale-[0.92]"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

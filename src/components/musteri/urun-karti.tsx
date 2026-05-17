'use client';

import { Minus, Plus } from 'lucide-react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';

export function UrunKarti({ urun }: { urun: Urun }) {
  const adet = useSepet((s) => s.adetGetir(urun.id));
  const ekle = useSepet((s) => s.ekle);
  const guncelle = useSepet((s) => s.guncelle);

  const stokYok = !urun.stoktaMi;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-tight">{urun.ad}</div>
        {urun.aciklama && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {urun.aciklama}
          </p>
        )}
        <div className="mt-2 text-sm font-semibold">
          {formatTL(urun.fiyatKurus)}
        </div>
      </div>

      <div className="shrink-0">
        {stokYok ? (
          <span className="text-xs text-muted-foreground">Stokta yok</span>
        ) : adet === 0 ? (
          <button
            type="button"
            onClick={() => ekle(urun.id)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Ekle
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-md border bg-background">
            <button
              type="button"
              aria-label="Azalt"
              onClick={() => guncelle(urun.id, adet - 1)}
              className="p-1.5"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-5 text-center text-sm tabular-nums">
              {adet}
            </span>
            <button
              type="button"
              aria-label="Arttır"
              onClick={() => guncelle(urun.id, adet + 1)}
              className="p-1.5"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

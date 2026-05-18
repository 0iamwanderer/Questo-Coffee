'use client';

import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';

interface Props {
  urunler: Urun[];
  sepetUrunIds: Set<string>;
}

// Sepete daha çeşitli ürün önerisi (kategori farkı tercih edilir)
function onerilenleriSec(urunler: Urun[], hariç: Set<string>): Urun[] {
  const adaylar = urunler.filter(
    (u) =>
      !hariç.has(u.id) && u.stoktaMi && (u.opsiyonGruplari?.length ?? 0) === 0,
  );
  // sira düşük olanlar (vitrin ürünleri) öncelik
  return adaylar.sort((a, b) => a.sira - b.sira).slice(0, 4);
}

export function Tamamlayicilar({ urunler, sepetUrunIds }: Props) {
  const ekle = useSepet((s) => s.ekle);

  const oneriler = useMemo(
    () => onerilenleriSec(urunler, sepetUrunIds),
    [urunler, sepetUrunIds],
  );

  if (oneriler.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border bg-card/60 p-4">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" />
        <span className="micro-caps text-muted-foreground">
          Bunlar da iyi gider
        </span>
      </div>
      <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {oneriler.map((u) => (
          <li key={u.id} className="shrink-0">
            <div className="flex w-32 flex-col gap-1.5">
              <div className="relative h-24 w-32 overflow-hidden rounded-xl border bg-muted/40 shadow-soft">
                {u.gorselUrl ? (
                  <Image
                    src={u.gorselUrl}
                    alt={u.ad}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center font-serif text-3xl text-primary/70"
                    style={{
                      background:
                        'radial-gradient(70% 60% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
                    }}
                  >
                    {u.ad.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  aria-label={`${u.ad} ekle`}
                  onClick={() => ekle(u.id)}
                  className="absolute bottom-1 right-1 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition active:scale-90"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="px-0.5">
                <div className="line-clamp-1 text-xs font-medium">{u.ad}</div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {formatTL(u.fiyatKurus)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

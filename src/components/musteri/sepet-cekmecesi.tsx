'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useSepet } from '@/stores/sepet';
import { useMasa } from '@/app/m/[token]/masa-provider';
import { cn } from '@/lib/utils';

export function SepetCekmecesi() {
  const toplam = useSepet((s) => s.toplamAdet());
  const { masaToken } = useMasa();

  // Sayı değişince badge'i pop'la
  const [pop, setPop] = useState(false);
  const oncekiToplam = useRef(toplam);
  useEffect(() => {
    if (toplam !== oncekiToplam.current) {
      setPop(true);
      oncekiToplam.current = toplam;
      const t = setTimeout(() => setPop(false), 320);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [toplam]);

  if (toplam === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <Link
        href={`/m/${masaToken}/sepet`}
        data-sepet-target
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full bg-primary px-5 py-3.5 text-primary-foreground transition active:scale-[0.98]"
        style={{ boxShadow: 'var(--shadow-floating)' }}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="size-4" />
          Sepetim
        </span>
        <span
          className={cn(
            'rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium tabular-nums',
            pop && 'anim-pop',
          )}
        >
          {toplam} ürün
        </span>
      </Link>
    </div>
  );
}

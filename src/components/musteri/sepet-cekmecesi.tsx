'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useSepet } from '@/stores/sepet';
import { useMasa } from '@/app/m/[token]/masa-provider';

export function SepetCekmecesi() {
  const toplam = useSepet((s) => s.toplamAdet());
  const { masaToken } = useMasa();

  if (toplam === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <Link
        href={`/m/${masaToken}/sepet`}
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-floating transition active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="size-4" />
          Sepetim
        </span>
        <span className="rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium tabular-nums">
          {toplam} ürün
        </span>
      </Link>
    </div>
  );
}

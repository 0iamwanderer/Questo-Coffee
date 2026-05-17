'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { useMasa } from './masa-provider';

export function MasaBasligi() {
  const { masaAd, restoranAd, masaToken } = useMasa();
  return (
    <header className="mb-5 flex items-start justify-between gap-3 anim-fade-in">
      <div className="space-y-0.5">
        <p className="micro-caps text-muted-foreground">{masaAd}</p>
        <h1 className="font-serif text-3xl leading-none">{restoranAd}</h1>
      </div>
      <Link
        href={`/m/${masaToken}/adisyon`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs shadow-soft"
      >
        <Receipt className="size-3.5" />
        Adisyon
      </Link>
    </header>
  );
}

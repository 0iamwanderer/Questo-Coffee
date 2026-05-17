'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { useMasa } from './masa-provider';

export function MasaBasligi() {
  const { masaAd, restoranAd, masaToken } = useMasa();
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold leading-tight">{restoranAd}</h1>
        <p className="text-sm text-muted-foreground">{masaAd}</p>
      </div>
      <Link
        href={`/m/${masaToken}/adisyon`}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-foreground"
      >
        <Receipt className="size-3.5" />
        Adisyon
      </Link>
    </header>
  );
}

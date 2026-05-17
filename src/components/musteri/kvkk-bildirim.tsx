'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const KEY = 'questo-kvkk-onay';

export function KvkkBildirim({ masaToken }: { masaToken: string }) {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(KEY) === '1') return;
    setAcik(true);
  }, []);

  if (!acik) return null;

  const onayla = () => {
    localStorage.setItem(KEY, '1');
    setAcik(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="mx-auto max-w-md rounded-lg border bg-card p-3 shadow-lg space-y-2">
        <div className="flex items-start gap-2">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-xs text-foreground/90">
            Sipariş alabilmek için anonim bir cihaz kimliği oluşturuyoruz.
            Kişisel veriniz toplanmıyor.{' '}
            <Link
              href={`/m/${masaToken}/kvkk`}
              className="underline text-primary"
            >
              Detaylı bilgi
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onayla}
          className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}

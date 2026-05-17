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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-3xl border bg-card/95 p-4 shadow-floating backdrop-blur space-y-3 anim-fade-in">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">
            Sipariş alabilmek için anonim bir cihaz kimliği oluşturuyoruz.
            Adınız, telefon ve konum gibi kişisel veri toplanmaz.{' '}
            <Link
              href={`/m/${masaToken}/kvkk`}
              className="font-medium underline text-primary"
            >
              Detaylı bilgi
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onayla}
          className="w-full rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98]"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}

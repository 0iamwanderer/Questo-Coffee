'use client';

import { ArrowRight } from 'lucide-react';
import { useMasa } from './masa-provider';

export function Landing({ onEnter }: { onEnter: () => void }) {
  const { masaAd, restoranAd } = useMasa();
  const harf = restoranAd.trim().charAt(0).toUpperCase() || 'Q';

  return (
    <div className="relative flex h-full flex-col bg-background pt-11">
      {/* Üst etiket: masa + dil */}
      <div className="flex items-center justify-between px-6 pt-3">
        <div className="micro-caps inline-flex items-center gap-2 text-muted-foreground">
          <span className="inline-block size-1 rounded-full bg-primary" />
          {masaAd}
        </div>
        <span className="micro-caps text-muted-foreground">TR</span>
      </div>

      {/* Orta */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Logo monogram */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 220,
            height: 220,
            background:
              'radial-gradient(70% 60% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
            boxShadow: 'var(--shadow-floating)',
          }}
        >
          <span className="font-serif text-8xl text-primary/70 leading-none">
            {harf}
          </span>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 35%, rgba(255,225,180,0.18), transparent 70%)',
              mixBlendMode: 'soft-light',
            }}
          />
        </div>

        {/* Alt başlık */}
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-6 bg-border" />
          <span className="micro-caps text-muted-foreground">
            kahve &amp; mola
          </span>
          <span className="h-px w-6 bg-border" />
        </div>

        {/* Restoran adı (büyük serif) */}
        <h1 className="mt-3 font-serif text-5xl leading-none">
          {restoranAd}
        </h1>

        {/* Karşılama */}
        <p className="mt-6 max-w-[300px] text-[15px] leading-[1.55] text-muted-foreground">
          Hoş geldiniz. Sakin bir köşeye yerleşin, menü artık parmaklarınızın
          ucunda.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onEnter}
          className="group mt-8 inline-flex w-full max-w-[300px] items-center justify-between rounded-full bg-foreground px-6 py-4 text-[15px] font-medium text-background transition active:scale-[0.98]"
        >
          <span>Menüyü Gör</span>
          <span
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-1"
          >
            <ArrowRight className="size-4" />
          </span>
        </button>

        <p className="mt-5 micro-caps text-muted-foreground">
          Servis · 08:00 – 23:00
        </p>
      </div>

      {/* Alt dipnot */}
      <div className="micro-caps flex items-center justify-center gap-2 pb-6 text-muted-foreground">
        <span>QR ile sipariş</span>
        <span className="h-px w-3 bg-border" />
        <span>Questo</span>
      </div>
    </div>
  );
}

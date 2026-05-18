'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useMasa } from './masa-provider';

export function Landing({ onEnter }: { onEnter: () => void }) {
  const { masaAd, restoranAd } = useMasa();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background pt-11">
      {/* Arka plan: sıcak radyal gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 30%, hsl(var(--accent) / 0.55) 0%, transparent 70%)',
        }}
      />

      {/* Üst etiket: masa + dil */}
      <div className="relative flex items-center justify-between px-6 pt-3">
        <div className="micro-caps inline-flex items-center gap-2 text-muted-foreground">
          <span className="inline-block size-1 rounded-full bg-primary" />
          {masaAd}
        </div>
        <span className="micro-caps text-muted-foreground">TR</span>
      </div>

      {/* Orta */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div
          className="relative size-56 overflow-hidden rounded-full"
          style={{ boxShadow: 'var(--shadow-floating)' }}
        >
          <Image
            src="/logo.png"
            alt={`${restoranAd} logo`}
            fill
            sizes="224px"
            priority
            className="object-cover"
          />
          {/* Yumuşak iç parlaklık */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 30%, rgba(255,225,180,0.18), transparent 65%)',
              mixBlendMode: 'soft-light',
            }}
          />
        </div>

        {/* Alt etiket */}
        <div className="mt-7 flex items-center gap-3">
          <span className="h-px w-6 bg-border" />
          <span className="micro-caps text-muted-foreground">
            kahve &amp; mola
          </span>
          <span className="h-px w-6 bg-border" />
        </div>

        {/* Karşılama */}
        <p className="mt-5 max-w-[300px] text-[15px] leading-[1.6] text-muted-foreground">
          Hoş geldiniz. Sakin bir köşeye yerleşin, menü artık parmaklarınızın
          ucunda.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onEnter}
          className="group mt-9 inline-flex w-full max-w-[300px] items-center justify-between rounded-full bg-primary px-6 py-4 text-[15px] font-medium text-primary-foreground shadow-soft transition active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <span>Menüyü Gör</span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-4" />
          </span>
        </button>

        <p className="mt-6 micro-caps text-muted-foreground">
          Servis · 08:00 – 23:00
        </p>
      </div>

      {/* Alt dipnot */}
      <div className="relative micro-caps flex items-center justify-center gap-2 pb-7 text-muted-foreground">
        <span>EST. 2024</span>
        <span className="h-px w-3 bg-border" />
        <span>QR Sipariş</span>
      </div>
    </div>
  );
}

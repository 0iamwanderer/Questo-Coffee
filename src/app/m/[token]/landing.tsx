'use client';

import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { useMasa } from './masa-provider';
import { CanliSaat } from '@/components/musteri/canli-saat';

// Dekoratif yaprak motifi (köşeler için)
function YaprakSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M8 56C20 56 32 44 32 32C32 20 44 8 56 8C56 20 44 32 32 32C20 32 8 44 8 56Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 50L50 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

// Kahve çekirdeği motifi
function CekirdekSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="16"
        cy="16"
        rx="9"
        ry="13"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M16 4C16 12 16 20 16 28"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function Landing({ onEnter }: { onEnter: () => void }) {
  const { masaAd, restoranAd } = useMasa();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background pt-11">
      {/* Arka plan: çift radyal gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 30%, hsl(var(--accent) / 0.75) 0%, transparent 65%), radial-gradient(60% 50% at 50% 85%, hsl(var(--primary) / 0.07) 0%, transparent 60%)',
        }}
      />

      {/* Köşe dekoratif yapraklar */}
      <YaprakSvg
        className="anim-float pointer-events-none absolute -left-3 top-20 size-20 text-primary/15"
      />
      <YaprakSvg
        className="anim-float pointer-events-none absolute -right-3 bottom-32 size-24 rotate-180 text-primary/15"
        // eslint-disable-next-line react/no-unknown-property
      />
      <CekirdekSvg className="pointer-events-none absolute right-8 top-32 size-8 rotate-12 text-primary/20" />
      <CekirdekSvg className="pointer-events-none absolute left-10 bottom-40 size-6 -rotate-12 text-primary/20" />

      {/* Üst etiket: masa + dil */}
      <div className="anim-rise anim-rise-1 relative flex items-center justify-between px-6 pt-3">
        <div className="micro-caps inline-flex items-center gap-2 text-muted-foreground">
          <span className="inline-block size-1 rounded-full bg-primary" />
          {masaAd}
        </div>
        <span className="micro-caps text-muted-foreground">TR</span>
      </div>

      {/* Orta */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Logo + arkasında dönen halo */}
        <div className="anim-rise anim-rise-2 relative">
          {/* Dış halo — yavaş döner */}
          <div
            aria-hidden
            className="anim-spin-slow absolute -inset-6 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, hsl(var(--accent) / 0.0), hsl(var(--accent) / 0.55), hsl(var(--accent) / 0.0))',
              filter: 'blur(18px)',
              opacity: 0.55,
            }}
          />
          {/* Buharlı kahve şeritleri */}
          <div
            aria-hidden
            className="anim-steam pointer-events-none absolute left-1/2 -top-6 h-8 w-1 -translate-x-1/2 rounded-full bg-primary/15"
          />
          <div
            aria-hidden
            className="anim-steam pointer-events-none absolute left-[58%] -top-8 h-8 w-0.5 -translate-x-1/2 rounded-full bg-primary/12"
            style={{ animationDelay: '1.4s' }}
          />

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
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(70% 60% at 50% 30%, rgba(255,225,180,0.20), transparent 65%)',
                mixBlendMode: 'soft-light',
              }}
            />
          </div>
        </div>

        {/* Alt etiket */}
        <div className="anim-rise anim-rise-3 mt-8 flex items-center gap-3">
          <span className="h-px w-8 bg-border" />
          <span className="micro-caps text-muted-foreground">
            kahve &amp; mola
          </span>
          <span className="h-px w-8 bg-border" />
        </div>

        {/* Slogan */}
        <p className="anim-rise anim-rise-3 mt-3 font-serif text-xl italic text-foreground/80">
          her fincan bir hikâye
        </p>

        {/* Karşılama */}
        <p className="anim-rise anim-rise-4 mt-4 max-w-[300px] text-[14px] leading-[1.65] text-muted-foreground">
          Sakin bir köşeye yerleşin, menü artık parmaklarınızın ucunda.
          Demin hazır.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onEnter}
          className="anim-rise anim-rise-4 group mt-9 inline-flex w-full max-w-[300px] items-center justify-between rounded-full bg-primary px-6 py-4 text-[15px] font-medium text-primary-foreground transition active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-floating)' }}
        >
          <span>Menüyü Gör</span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-4" />
          </span>
        </button>

        {/* Servis bilgisi — canlı saat + servis aralığı */}
        <div className="anim-rise anim-rise-5 mt-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-1.5 backdrop-blur">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="micro-caps text-muted-foreground">
            <CanliSaat />
            <span className="mx-1.5">·</span>
            Servis 08:00 – 23:00
          </span>
        </div>
      </div>

      {/* Alt dipnot */}
      <div className="anim-rise anim-rise-5 relative micro-caps flex items-center justify-center gap-2 pb-7 text-muted-foreground">
        <span>EST. 2024</span>
        <span className="h-px w-3 bg-border" />
        <span>QR ile Sipariş</span>
        <span className="h-px w-3 bg-border" />
        <span>Questo Coffea Co.</span>
      </div>
    </div>
  );
}

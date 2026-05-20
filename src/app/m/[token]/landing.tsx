'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { useMasa } from './masa-provider';

export function Landing({ onEnter }: { onEnter: () => void }) {
  const { masaAd, restoranAd } = useMasa();

  return (
    <div
      className="relative flex h-full flex-col items-center justify-between overflow-hidden px-6 py-10"
      style={{ background: 'hsl(22 42% 7%)' }}
    >
      {/* Arka plan: kağıt dokusu */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cekirdek opacity-20"
      />

      {/* Üst süsleme: ince çerçeve çizgisi */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-2xl"
        style={{ border: '1px solid hsl(38 42% 28% / 0.6)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[18px] rounded-xl"
        style={{ border: '1px solid hsl(38 42% 22% / 0.4)' }}
      />

      {/* Üst köşe süsleri */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 top-6 size-5"
        style={{
          borderTop: '1.5px solid hsl(38 42% 40%)',
          borderLeft: '1.5px solid hsl(38 42% 40%)',
          borderRadius: '3px 0 0 0',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 top-6 size-5"
        style={{
          borderTop: '1.5px solid hsl(38 42% 40%)',
          borderRight: '1.5px solid hsl(38 42% 40%)',
          borderRadius: '0 3px 0 0',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-6 size-5"
        style={{
          borderBottom: '1.5px solid hsl(38 42% 40%)',
          borderLeft: '1.5px solid hsl(38 42% 40%)',
          borderRadius: '0 0 0 3px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 right-6 size-5"
        style={{
          borderBottom: '1.5px solid hsl(38 42% 40%)',
          borderRight: '1.5px solid hsl(38 42% 40%)',
          borderRadius: '0 0 3px 0',
        }}
      />

      {/* Masa etiketi */}
      <div className="anim-rise anim-rise-1 relative flex items-center gap-2 mt-6">
        <span className="h-px w-6" style={{ background: 'hsl(38 42% 35%)' }} />
        <span
          className="micro-caps"
          style={{ color: 'hsl(38 42% 50%)', letterSpacing: '0.22em' }}
        >
          {masaAd}
        </span>
        <span className="h-px w-6" style={{ background: 'hsl(38 42% 35%)' }} />
      </div>

      {/* Orta: logo + isim */}
      <div className="relative flex flex-col items-center gap-7">
        {/* Logo */}
        <div className="anim-rise anim-rise-2 relative">
          {/* Dönen aura */}
          <div
            aria-hidden
            className="anim-spin-slow absolute rounded-full"
            style={{
              inset: '-20px',
              background:
                'conic-gradient(from 0deg, transparent 40%, hsl(38 56% 55% / 0.3) 55%, transparent 70%)',
              filter: 'blur(14px)',
            }}
          />
          {/* Buharlı şeritler */}
          <div
            aria-hidden
            className="anim-steam pointer-events-none absolute left-1/2 -top-5 h-7 w-0.5 -translate-x-1/2 rounded-full"
            style={{ background: 'hsl(38 42% 60% / 0.2)' }}
          />
          <div
            aria-hidden
            className="anim-steam pointer-events-none absolute -top-7 rounded-full"
            style={{
              left: 'calc(50% + 10px)',
              height: '28px',
              width: '2px',
              background: 'hsl(38 42% 60% / 0.15)',
              animationDelay: '1.2s',
            }}
          />

          <div
            className="relative overflow-hidden rounded-full"
            style={{
              width: '164px',
              height: '164px',
              border: '1px solid hsl(38 42% 30%)',
              boxShadow:
                '0 0 40px -8px hsl(38 42% 40% / 0.35), 0 24px 56px -20px rgba(0,0,0,0.75)',
            }}
          >
            <Image
              src="/logo.jpg"
              alt={`${restoranAd} logo`}
              fill
              sizes="164px"
              priority
              className="object-cover"
            />
            {/* Parlama kaplama */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(60% 50% at 40% 25%, rgba(255,230,170,0.18), transparent 70%)',
              }}
            />
          </div>
        </div>

        {/* Restoran adı */}
        <div className="anim-rise anim-rise-3 flex flex-col items-center gap-2">
          <h1
            className="font-serif text-center"
            style={{
              fontSize: 'clamp(30px, 9vw, 44px)',
              color: 'hsl(46 56% 91%)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {restoranAd}
          </h1>

          {/* Orta süsleme çizgisi */}
          <div className="flex items-center gap-3">
            <span className="h-px w-10" style={{ background: 'hsl(38 42% 32%)' }} />
            <span
              className="font-serif"
              style={{ color: 'hsl(38 42% 52%)', fontSize: '16px' }}
            >
              ❦
            </span>
            <span className="h-px w-10" style={{ background: 'hsl(38 42% 32%)' }} />
          </div>

          <p
            className="font-serif italic text-center"
            style={{
              fontSize: '13px',
              color: 'hsl(46 56% 75% / 0.5)',
              letterSpacing: '0.02em',
            }}
          >
            her fincan bir hikâye
          </p>
        </div>
      </div>

      {/* Alt: buton + dipnot */}
      <div className="anim-rise anim-rise-4 flex flex-col items-center gap-5 w-full max-w-[280px] mb-6">
        <button
          type="button"
          onClick={onEnter}
          className="group w-full inline-flex items-center justify-between rounded-full px-6 py-[14px] text-[15px] font-medium transition active:scale-[0.98]"
          style={{
            background: 'hsl(46 56% 91%)',
            color: 'hsl(22 42% 12%)',
            boxShadow:
              '0 20px 48px -16px hsl(46 56% 70% / 0.25), 0 6px 16px -6px rgba(0,0,0,0.5)',
          }}
        >
          <span>Menüye Bak</span>
          <span
            className="inline-flex size-9 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
            style={{ background: 'hsl(22 42% 12% / 0.09)' }}
          >
            <BookOpen className="size-4" />
          </span>
        </button>

        <div
          className="micro-caps flex items-center gap-2"
          style={{ color: 'hsl(38 42% 34%)' }}
        >
          <span>EST. 2024</span>
          <span className="h-px w-3" style={{ background: 'hsl(38 42% 34%)' }} />
          <span>QR Menü</span>
          <span className="h-px w-3" style={{ background: 'hsl(38 42% 34%)' }} />
          <span>Questo</span>
        </div>
      </div>
    </div>
  );
}

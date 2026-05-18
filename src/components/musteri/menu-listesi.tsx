'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, ShoppingBag } from 'lucide-react';
import { getClientDb } from '@/lib/firebase/client';
import {
  kategoriConverter,
  urunConverter,
} from '@/lib/firebase/converters';
import type { Kategori, Urun } from '@/types/model';
import { UrunDetaySheet } from './urun-detay-sheet';
import { useSepet } from '@/stores/sepet';
import { flyToCart } from './sepete-uc';
import { useMasa } from '@/app/m/[token]/masa-provider';
import { cn } from '@/lib/utils';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;
const ROMAN_SAYILAR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function fiyatYaz(kurus: number) {
  return `₺${Math.round(kurus / 100)}`;
}

/* ─── Spiral binding ─── */
function SarmalCilt() {
  return (
    <div
      className="w-8 flex-shrink-0 flex flex-col items-center justify-evenly self-stretch py-3 overflow-hidden"
      style={{ background: 'hsl(28 22% 14%)' }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full flex-shrink-0 border-2"
          style={{
            borderColor: 'hsl(36 18% 28%)',
            backgroundColor: 'hsl(22 42% 10%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Subcategory header within a page ─── */
function AltGrupBaslik({ baslik }: { baslik: string }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <span className="flex-1 h-px bg-foreground/10" />
      <span className="micro-caps text-foreground/35 text-[9px]">{baslik}</span>
      <span className="flex-1 h-px bg-foreground/10" />
    </div>
  );
}

/* ─── Single item row in the book ─── */
function KalemSatiri({
  urun,
  onDetay,
}: {
  urun: Urun;
  onDetay: (u: Urun) => void;
}) {
  const adet = useSepet((s) => s.adetGetir(urun.id));
  const ekle = useSepet((s) => s.ekle);
  const guncelle = useSepet((s) => s.guncelle);
  const kalemler = useSepet((s) => s.kalemler);
  const btnRef = useRef<HTMLButtonElement>(null);

  const opsiyonlu = (urun.opsiyonGruplari?.length ?? 0) > 0;
  const stokYok = !urun.stoktaMi;
  const tekSatir = !opsiyonlu
    ? kalemler.find((k) => k.urunId === urun.id && !k.secimler)
    : undefined;

  const handleEkle = () => {
    if (opsiyonlu) {
      onDetay(urun);
      return;
    }
    ekle(urun.id);
    if (btnRef.current) {
      flyToCart({
        fromRect: btnRef.current.getBoundingClientRect(),
        harf: urun.ad.charAt(0),
      });
    }
  };

  return (
    <div className={cn('py-2', stokYok && 'opacity-40')}>
      {/* Name · dotted leader · price · button — all on one flex row */}
      <div className="flex items-end gap-1.5">
        <button
          type="button"
          onClick={() => !stokYok && onDetay(urun)}
          className="font-serif text-[15px] leading-snug shrink-0 text-left hover:text-primary transition-colors"
        >
          {urun.ad}
        </button>

        {urun.sefOnerisi && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-primary leading-none mb-[3px]"
            style={{
              border: '1px solid hsl(13 58% 23% / 0.45)',
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Şefin Önerisi
          </span>
        )}

        {/* dotted leader */}
        <span
          aria-hidden
          className="flex-1 border-b border-dotted border-foreground/20 mb-[4px] min-w-2"
        />

        {/* price */}
        <span className="font-serif text-[15px] shrink-0 tabular-nums">
          {fiyatYaz(urun.fiyatKurus)}
        </span>

        {/* action button */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {stokYok ? (
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-foreground/25"
              style={{ border: '1px solid hsl(22 42% 12% / 0.15)' }}
            >
              <span className="text-[10px]">—</span>
            </span>
          ) : adet > 0 ? (
            <button
              type="button"
              onClick={() =>
                tekSatir
                  ? guncelle(tekSatir.satirId, adet - 1)
                  : onDetay(urun)
              }
              className="w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90"
              style={{
                border: '1px solid hsl(13 58% 23% / 0.35)',
                backgroundColor: 'hsl(13 58% 23% / 0.08)',
              }}
              aria-label={`${urun.ad} sepetten çıkar`}
            >
              <span className="font-mono text-[11px] text-primary tabular-nums font-medium">
                {adet}
              </span>
            </button>
          ) : (
            <button
              ref={btnRef}
              type="button"
              onClick={handleEkle}
              className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition active:scale-90 shadow-soft"
              aria-label={`${urun.ad} sepete ekle`}
            >
              <Plus className="size-3" />
            </button>
          )}
        </div>
      </div>

      {urun.aciklama && (
        <p
          className="leading-snug mt-0.5 text-foreground/45"
          style={{ fontSize: '11px' }}
        >
          {urun.aciklama}
        </p>
      )}
    </div>
  );
}

/* ─── Types for grouping ─── */
type ItemGrup = { baslik: string | null; urunler: Urun[] };

function grupla(urunler: Urun[]): ItemGrup[] {
  const map = new Map<string, Urun[]>();
  for (const u of urunler) {
    const k = u.altKategori ?? '';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(u);
  }
  return Array.from(map.entries()).map(([k, list]) => ({
    baslik: k || null,
    urunler: list,
  }));
}

/* Split groups roughly in half for left/right pages */
function sayfayaBol(gruplar: ItemGrup[]): {
  sol: ItemGrup[];
  sag: ItemGrup[];
} {
  if (gruplar.length === 0) return { sol: [], sag: [] };

  const toplamUrun = gruplar.reduce((t, g) => t + g.urunler.length, 0);
  if (toplamUrun <= 1) return { sol: gruplar, sag: [] };

  const hedef = Math.ceil(toplamUrun / 2);
  let sayac = 0;

  for (let i = 0; i < gruplar.length; i++) {
    const grup = gruplar[i]!;
    sayac += grup.urunler.length;
    if (sayac >= hedef) {
      // If not the last group, split at group boundary
      if (i < gruplar.length - 1) {
        return { sol: gruplar.slice(0, i + 1), sag: gruplar.slice(i + 1) };
      }
      // Last group — split its items
      const onceki = gruplar.slice(0, i);
      const kalan = hedef - (sayac - grup.urunler.length);
      return {
        sol: [
          ...onceki,
          { baslik: grup.baslik, urunler: grup.urunler.slice(0, kalan) },
        ],
        sag: [{ baslik: null, urunler: grup.urunler.slice(kalan) }],
      };
    }
  }

  return { sol: gruplar, sag: [] };
}

/* ─── Page content renderer ─── */
function SayfaIcerik({
  gruplar,
  onDetay,
}: {
  gruplar: ItemGrup[];
  onDetay: (u: Urun) => void;
}) {
  return (
    <>
      {gruplar.map((g, i) => (
        <div key={i}>
          {g.baslik && <AltGrupBaslik baslik={g.baslik} />}
          {g.urunler.map((u) => (
            <KalemSatiri key={u.id} urun={u} onDetay={onDetay} />
          ))}
        </div>
      ))}
    </>
  );
}

/* ─── Main export ─── */
export function MenuListesi({ onBack }: { onBack?: () => void } = {}) {
  const { masaToken, restoranAd } = useMasa();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [aktifId, setAktifId] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [detayUrun, setDetayUrun] = useState<Urun | null>(null);
  const toplamAdet = useSepet((s) => s.toplamAdet());

  useEffect(() => {
    const db = getClientDb();
    const kQ = query(
      collection(db, `restoranlar/${RESTORAN}/kategoriler`).withConverter(
        kategoriConverter,
      ),
      where('aktifMi', '==', true),
      orderBy('sira', 'asc'),
    );
    const uQ = query(
      collection(db, `restoranlar/${RESTORAN}/urunler`).withConverter(
        urunConverter,
      ),
      orderBy('sira', 'asc'),
    );
    const u1 = onSnapshot(kQ, (snap) => {
      setKategoriler(snap.docs.map((d) => d.data()));
      setYukleniyor(false);
    });
    const u2 = onSnapshot(uQ, (snap) => {
      setUrunler(snap.docs.map((d) => d.data()));
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!aktifId && kategoriler[0]) {
      setAktifId(kategoriler[0].id);
    }
  }, [kategoriler, aktifId]);

  const aktifIndeks = useMemo(
    () => kategoriler.findIndex((k) => k.id === aktifId),
    [kategoriler, aktifId],
  );

  const aktifKategori = kategoriler[aktifIndeks] ?? null;

  const goruntulenenUrunler = useMemo(
    () => urunler.filter((u) => u.kategoriId === aktifId),
    [urunler, aktifId],
  );

  const gruplar = useMemo(
    () => grupla(goruntulenenUrunler),
    [goruntulenenUrunler],
  );

  const { sol: solGruplar, sag: sagGruplar } = useMemo(
    () => sayfayaBol(gruplar),
    [gruplar],
  );

  const tumGruplar = useMemo(
    () => [...solGruplar, ...sagGruplar],
    [solGruplar, sagGruplar],
  );

  const roman = (k: Kategori | null, idx: number) =>
    k?.roman ?? ROMAN_SAYILAR[idx] ?? `${idx + 1}`;

  const onceki = () => {
    const prev = kategoriler[aktifIndeks - 1];
    if (aktifIndeks > 0 && prev) setAktifId(prev.id);
  };

  const sonraki = () => {
    const next = kategoriler[aktifIndeks + 1];
    if (aktifIndeks < kategoriler.length - 1 && next)
      setAktifId(next.id);
  };

  if (yukleniyor) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: 'hsl(22 42% 9%)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'hsl(22 42% 9%)', borderTopColor: 'transparent' }}
          />
          <p className="micro-caps text-white/35">Yükleniyor</p>
        </div>
      </div>
    );
  }

  const kAdAbbr = aktifKategori?.ad?.toUpperCase() ?? '';

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'hsl(22 42% 9%)' }}
    >
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-3 px-4 md:px-6 py-2.5 flex-shrink-0">
        {/* Logo + brand — clicking returns to landing */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2.5 shrink-0 text-left"
        >
          <div className="relative size-9 overflow-hidden rounded-full border border-white/10 flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt={restoranAd}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <div
              className="text-white leading-none"
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontSize: '15px',
              }}
            >
              Questo
            </div>
            <div
              className="text-white/40 mt-0.5"
              style={{
                fontFamily: 'var(--font-mono), ui-monospace, monospace',
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Coffea Co. · Manisa
            </div>
          </div>
        </button>

        {/* Category tabs */}
        <nav
          className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 justify-center"
          aria-label="Kategoriler"
        >
          {kategoriler.map((k, i) => {
            const r = roman(k, i);
            const isActive = k.id === aktifId;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setAktifId(k.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-white/50 hover:text-white/80',
                )}
                style={
                  isActive
                    ? {
                        background: 'hsl(46 56% 91%)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      }
                    : undefined
                }
              >
                <span
                  className="italic"
                  style={{
                    fontFamily: 'var(--font-serif), Georgia, serif',
                    fontSize: '11px',
                    opacity: isActive ? 0.5 : 0.45,
                  }}
                >
                  {r}
                </span>
                <span>{k.ad}</span>
              </button>
            );
          })}
        </nav>

        {/* Cart button */}
        <Link
          href={`/m/${masaToken}/sepet`}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/15 text-white/65 hover:text-white transition shrink-0 text-sm"
        >
          <ShoppingBag className="size-4" />
          <span className="hidden sm:inline">Sepet</span>
          {toplamAdet > 0 && (
            <span
              className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 tabular-nums"
              style={{
                fontFamily: 'var(--font-mono), ui-monospace, monospace',
                fontSize: '10px',
              }}
            >
              {toplamAdet}
            </span>
          )}
        </Link>
      </header>

      {/* ── Book area ── */}
      <div className="flex-1 flex items-center justify-center px-3 md:px-8 pb-3 overflow-hidden">
        <div
          key={aktifId ?? 'empty'}
          className="h-full max-w-5xl w-full flex overflow-hidden rounded-r-xl anim-fade-in"
          style={{
            boxShadow:
              '0 32px 80px -16px rgba(0,0,0,0.75), 0 8px 20px -6px rgba(0,0,0,0.45)',
          }}
        >
          {/* Spiral binding */}
          <SarmalCilt />

          {/* Left page */}
          <div
            className="flex-1 flex flex-col overflow-hidden bg-paper"
            style={{ background: 'hsl(46 56% 91%)' }}
          >
            <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-5 md:pt-7 pb-3">
              {/* Category header */}
              <div className="mb-5">
                <div className="flex items-start gap-3">
                  {aktifKategori && (
                    <span
                      className="font-serif italic text-primary/70 leading-none shrink-0"
                      style={{ fontSize: 'clamp(52px, 6vw, 72px)', lineHeight: 0.88 }}
                    >
                      {roman(aktifKategori, aktifIndeks)}
                    </span>
                  )}
                  <div className="pt-0.5">
                    <h2
                      className="font-serif text-foreground leading-tight"
                      style={{ fontSize: 'clamp(24px, 3.5vw, 34px)' }}
                    >
                      {aktifKategori?.ad}
                    </h2>
                    {aktifKategori?.tagline && (
                      <p
                        className="font-serif italic text-foreground/50 mt-1"
                        style={{ fontSize: '13px' }}
                      >
                        {aktifKategori.tagline}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 h-px bg-foreground/15" />
              </div>

              {goruntulenenUrunler.length === 0 ? (
                <p
                  className="text-center text-foreground/30 py-10 font-serif italic"
                  style={{ fontSize: '13px' }}
                >
                  Bu kategoride ürün yok.
                </p>
              ) : (
                <>
                  {/* Mobile: all items on one page */}
                  <div className="md:hidden">
                    <SayfaIcerik
                      gruplar={tumGruplar}
                      onDetay={setDetayUrun}
                    />
                  </div>
                  {/* Desktop: left half */}
                  <div className="hidden md:block">
                    <SayfaIcerik
                      gruplar={solGruplar}
                      onDetay={setDetayUrun}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Page label */}
            <div className="px-5 md:px-8 py-2 border-t border-foreground/10">
              <span className="micro-caps text-foreground/30 text-[8px]">
                {kAdAbbr} · SOL
              </span>
            </div>
          </div>

          {/* Page divider */}
          <div
            className="hidden md:block w-px flex-shrink-0"
            style={{ background: 'hsl(38 42% 72%)' }}
          />

          {/* Right page — desktop only */}
          <div
            className="hidden md:flex flex-col flex-1 overflow-hidden bg-paper"
            style={{ background: 'hsl(46 56% 93%)' }}
          >
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-3">
              {sagGruplar.length > 0 ? (
                <SayfaIcerik
                  gruplar={sagGruplar}
                  onDetay={setDetayUrun}
                />
              ) : (
                <div className="h-full flex items-center justify-center opacity-20">
                  <span
                    className="font-serif italic text-foreground"
                    style={{ fontSize: '20px' }}
                  >
                    —
                  </span>
                </div>
              )}
            </div>
            {/* Page label */}
            <div className="px-8 py-2 border-t border-foreground/10">
              <span className="micro-caps text-foreground/30 text-[8px]">
                {kAdAbbr} · SAĞ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="flex items-center justify-center gap-6 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onceki}
          disabled={aktifIndeks <= 0}
          className="size-10 rounded-full border border-white/15 text-white/50 flex items-center justify-center disabled:opacity-20 hover:text-white hover:border-white/30 transition active:scale-95"
          aria-label="Önceki kategori"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="text-center" style={{ minWidth: '96px' }}>
          <div
            className="text-white tabular-nums"
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: '20px',
            }}
          >
            {String(aktifIndeks + 1).padStart(2, '0')} /{' '}
            {String(kategoriler.length).padStart(2, '0')}
          </div>
          <div
            className="text-white/35 mt-0.5"
            style={{
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {aktifKategori?.ad ?? ''}
          </div>
        </div>

        <button
          type="button"
          onClick={sonraki}
          disabled={aktifIndeks >= kategoriler.length - 1}
          className="size-10 rounded-full border border-white/15 text-white/50 flex items-center justify-center disabled:opacity-20 hover:text-white hover:border-white/30 transition active:scale-95"
          aria-label="Sonraki kategori"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <UrunDetaySheet
        urun={detayUrun}
        acik={!!detayUrun}
        onKapat={() => setDetayUrun(null)}
      />
    </div>
  );
}

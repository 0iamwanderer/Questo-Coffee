'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, ShoppingBag, X } from 'lucide-react';
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
import { SepetIcerik } from '@/app/m/[token]/sepet/sepet-icerik';

type SayfaYonu = 'forward' | 'backward' | 'none';

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
    <div className="flex items-center gap-3 my-4">
      <span className="flex-1 h-px bg-foreground/10" />
      <span
        className="micro-caps text-foreground/40"
        style={{ fontSize: '10px', letterSpacing: '0.22em' }}
      >
        {baslik}
      </span>
      <span className="flex-1 h-px bg-foreground/10" />
    </div>
  );
}

/* ─── Ornament — sparse page'lerde kâğıdı doldurur ─── */
function SayfaFleron() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center py-4 text-foreground/20 select-none"
      style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '22px', letterSpacing: '0.4em' }}
    >
      ❦
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
    <div className={cn('py-3', stokYok && 'opacity-40')}>
      {/* Name · dotted leader · price · button — all on one flex row */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => !stokYok && onDetay(urun)}
          className="font-serif leading-snug shrink-0 text-left hover:text-primary transition-colors"
          style={{ fontSize: 'clamp(17px, 1.55vw, 22px)' }}
        >
          {urun.ad}
        </button>

        {urun.sefOnerisi && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-primary leading-none mb-[5px]"
            style={{
              border: '1px solid hsl(13 58% 23% / 0.45)',
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Şefin Önerisi
          </span>
        )}

        {/* dotted leader */}
        <span
          aria-hidden
          className="flex-1 border-b border-dotted border-foreground/25 mb-[6px] min-w-3"
        />

        {/* price */}
        <span
          className="font-serif shrink-0 tabular-nums"
          style={{ fontSize: 'clamp(17px, 1.55vw, 22px)' }}
        >
          {fiyatYaz(urun.fiyatKurus)}
        </span>

        {/* action button */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {stokYok ? (
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/25"
              style={{ border: '1px solid hsl(22 42% 12% / 0.15)' }}
            >
              <span className="text-[11px]">—</span>
            </span>
          ) : adet > 0 ? (
            <button
              type="button"
              onClick={() =>
                tekSatir
                  ? guncelle(tekSatir.satirId, adet - 1)
                  : onDetay(urun)
              }
              className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
              style={{
                border: '1px solid hsl(13 58% 23% / 0.35)',
                backgroundColor: 'hsl(13 58% 23% / 0.08)',
              }}
              aria-label={`${urun.ad} sepetten çıkar`}
            >
              <span className="font-mono text-[13px] text-primary tabular-nums font-medium">
                {adet}
              </span>
            </button>
          ) : (
            <button
              ref={btnRef}
              type="button"
              onClick={handleEkle}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition active:scale-90 shadow-soft"
              aria-label={`${urun.ad} sepete ekle`}
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      {urun.aciklama && (
        <p
          className="leading-snug mt-1 text-foreground/50"
          style={{ fontSize: '13px' }}
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

/* ─── Page content renderer — az kalem varsa fleron ile dengele ─── */
function SayfaIcerik({
  gruplar,
  onDetay,
  fleronEsiği = 4,
}: {
  gruplar: ItemGrup[];
  onDetay: (u: Urun) => void;
  fleronEsiği?: number;
}) {
  const toplamUrun = gruplar.reduce((t, g) => t + g.urunler.length, 0);
  const seyrek = toplamUrun > 0 && toplamUrun < fleronEsiği;
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
      {seyrek && <SayfaFleron />}
    </>
  );
}

/* ─── KitapSpread — tek kategorinin sol+sağ sayfa görünümü (ciltsiz) ─── */
function KitapSpread({
  kategori,
  indeks,
  urunler,
  onDetay,
  roman,
  interaktif = true,
}: {
  kategori: Kategori | null;
  indeks: number;
  urunler: Urun[];
  onDetay: (u: Urun) => void;
  roman: (k: Kategori | null, idx: number) => string;
  interaktif?: boolean;
}) {
  const gruplar = useMemo(() => grupla(urunler), [urunler]);
  const { sol: solGruplar, sag: sagGruplar } = useMemo(
    () => sayfayaBol(gruplar),
    [gruplar],
  );
  const tumGruplar = useMemo(
    () => [...solGruplar, ...sagGruplar],
    [solGruplar, sagGruplar],
  );
  const kAdAbbr = kategori?.ad?.toUpperCase() ?? '';

  return (
    <div
      className="h-full w-full flex overflow-hidden rounded-r-xl"
      style={{
        pointerEvents: interaktif ? 'auto' : 'none',
        boxShadow:
          '0 32px 80px -16px rgba(0,0,0,0.75), 0 8px 20px -6px rgba(0,0,0,0.45)',
      }}
    >
      {/* Left page */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'hsl(46 56% 91%)' }}
      >
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-6 md:pt-9 pb-4 flex flex-col">
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-start gap-4">
              {kategori && (
                <span
                  className="font-serif italic text-primary/70 leading-none shrink-0"
                  style={{ fontSize: 'clamp(64px, 7vw, 88px)', lineHeight: 0.86 }}
                >
                  {roman(kategori, indeks)}
                </span>
              )}
              <div className="pt-1">
                <h2
                  className="font-serif text-foreground leading-tight"
                  style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
                >
                  {kategori?.ad}
                </h2>
                {kategori?.tagline && (
                  <p
                    className="font-serif italic text-foreground/55 mt-1.5"
                    style={{ fontSize: 'clamp(13px, 1.1vw, 15px)' }}
                  >
                    {kategori.tagline}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 h-px bg-foreground/15" />
          </div>

          {urunler.length === 0 ? (
            <p
              className="text-center text-foreground/30 py-10 font-serif italic"
              style={{ fontSize: '13px' }}
            >
              Bu kategoride ürün yok.
            </p>
          ) : (
            <>
              <div className="md:hidden min-h-full flex flex-col justify-evenly">
                <SayfaIcerik gruplar={tumGruplar} onDetay={onDetay} />
              </div>
              <div className="hidden md:flex flex-col flex-1 justify-evenly">
                <SayfaIcerik gruplar={solGruplar} onDetay={onDetay} />
              </div>
            </>
          )}
        </div>

        <div className="px-6 md:px-10 py-2.5 border-t border-foreground/10">
          <span className="micro-caps text-foreground/30 text-[9px]">
            {kAdAbbr} · SOL
          </span>
        </div>
      </div>

      <div
        className="hidden md:block w-px flex-shrink-0"
        style={{ background: 'hsl(38 42% 72%)' }}
      />

      <div
        className="hidden md:flex flex-col flex-1 overflow-hidden"
        style={{ background: 'hsl(46 56% 93%)' }}
      >
        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-4 flex flex-col">
          {sagGruplar.length > 0 ? (
            <div className="flex-1 flex flex-col justify-evenly">
              <SayfaIcerik gruplar={sagGruplar} onDetay={onDetay} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-25 select-none">
              <span
                className="font-serif italic text-foreground/70"
                style={{ fontSize: '38px', letterSpacing: '0.4em' }}
              >
                ❦
              </span>
              <span
                className="font-serif italic text-foreground/50"
                style={{ fontSize: '13px' }}
              >
                {kategori?.ad ? `${kategori.ad} · devamı yok` : ''}
              </span>
            </div>
          )}
        </div>
        <div className="px-10 py-2.5 border-t border-foreground/10">
          <span className="micro-caps text-foreground/30 text-[9px]">
            {kAdAbbr} · SAĞ
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
const FLIP_SURE_MS = 820;

export function MenuListesi({ onBack }: { onBack?: () => void } = {}) {
  const { masaToken, restoranAd } = useMasa();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [aktifId, setAktifId] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [detayUrun, setDetayUrun] = useState<Urun | null>(null);
  // Flip durumu: yön + çevrilen önceki kategori snapshot'ı.
  // null değilse, üstteki overlay yön etrafında 180° döner.
  const [flip, setFlip] = useState<{
    yon: Exclude<SayfaYonu, 'none'>;
    oncekiId: string;
  } | null>(null);
  const [sepetAcik, setSepetAcik] = useState(false);
  const toplamAdet = useSepet((s) => s.toplamAdet());

  // Swipe gesture refs
  const swipeBas = useRef({ x: 0, y: 0 });

  // Flip animasyonu bittiğinde overlay'i kaldır
  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(() => setFlip(null), FLIP_SURE_MS + 30);
    return () => clearTimeout(t);
  }, [flip]);

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

  // Flip için önceki spread snapshot'ı
  const oncekiKategori = useMemo(
    () =>
      flip ? kategoriler.find((k) => k.id === flip.oncekiId) ?? null : null,
    [flip, kategoriler],
  );
  const oncekiIndeks = useMemo(
    () =>
      flip ? kategoriler.findIndex((k) => k.id === flip.oncekiId) : -1,
    [flip, kategoriler],
  );
  const oncekiUrunler = useMemo(
    () =>
      flip ? urunler.filter((u) => u.kategoriId === flip.oncekiId) : [],
    [flip, urunler],
  );

  const roman = (k: Kategori | null, idx: number) =>
    k?.roman ?? ROMAN_SAYILAR[idx] ?? `${idx + 1}`;

  const kategoriDegistir = (yeniId: string) => {
    if (yeniId === aktifId || flip) return; // çift tıkı / üst üste flip engelle
    const yeniIdx = kategoriler.findIndex((k) => k.id === yeniId);
    if (yeniIdx === -1 || aktifId == null) {
      setAktifId(yeniId);
      return;
    }
    const yon: Exclude<SayfaYonu, 'none'> =
      yeniIdx > aktifIndeks ? 'forward' : 'backward';
    setFlip({ yon, oncekiId: aktifId });
    setAktifId(yeniId);
  };

  const onceki = () => {
    const prev = kategoriler[aktifIndeks - 1];
    if (aktifIndeks > 0 && prev) kategoriDegistir(prev.id);
  };

  const sonraki = () => {
    const next = kategoriler[aktifIndeks + 1];
    if (aktifIndeks < kategoriler.length - 1 && next)
      kategoriDegistir(next.id);
  };

  const handleSwipeBas = (e: React.TouchEvent) => {
    swipeBas.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
  };

  const handleSwipeBirak = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0]!.clientX - swipeBas.current.x;
    const dy = e.changedTouches[0]!.clientY - swipeBas.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) sonraki();
      else onceki();
    }
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
                onClick={() => kategoriDegistir(k.id)}
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
        <button
          type="button"
          data-sepet-target
          onClick={() => setSepetAcik(true)}
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
        </button>
      </header>

      {/* ── Book area — spiral sabit, spread'ler flip eder ── */}
      <div
        className="flex-1 flex items-center justify-center px-3 md:px-8 pb-3 overflow-hidden"
        onTouchStart={handleSwipeBas}
        onTouchEnd={handleSwipeBirak}
      >
        <div className="h-full max-w-5xl w-full flex">
          {/* Spiral cilt — animasyondan etkilenmez */}
          <SarmalCilt />

          {/* Sayfalar bölgesi — perspective burada, böylece sadece spread döner */}
          <div
            className="relative flex-1"
            style={{
              perspective: '2400px',
              perspectiveOrigin: '50% 55%',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* ALT: yeni (aktif) spread — sabit */}
            <div
              className={cn(
                'absolute inset-0',
                flip ? 'anim-underlay-fade' : 'anim-fade-in',
              )}
            >
              <KitapSpread
                kategori={aktifKategori}
                indeks={aktifIndeks}
                urunler={goruntulenenUrunler}
                onDetay={setDetayUrun}
                roman={roman}
                interaktif={!flip}
              />
            </div>

            {/* ÜST: eski spread — overlay, omurga etrafında 180° döner.
                backface-visibility: hidden → 90°'yi geçince görünmez olur, alt açığa çıkar. */}
            {flip && oncekiKategori && (
              <div
                key={`flip-${flip.oncekiId}-${flip.yon}`}
                className={cn(
                  'absolute inset-0',
                  flip.yon === 'forward'
                    ? 'anim-page-flip-forward'
                    : 'anim-page-flip-backward',
                )}
                style={{ pointerEvents: 'none' }}
              >
                <KitapSpread
                  kategori={oncekiKategori}
                  indeks={oncekiIndeks}
                  urunler={oncekiUrunler}
                  onDetay={setDetayUrun}
                  roman={roman}
                  interaktif={false}
                />
                {/* Kıvrılma gölgesi flipping page üzerinde */}
                <div
                  className={cn(
                    'page-curl-overlay',
                    flip.yon === 'forward' ? 'forward' : 'backward',
                  )}
                />
              </div>
            )}
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

      {/* ── Sepet Sheet — partial bottom overlay ── */}
      {sepetAcik && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(18, 10, 5, 0.55)' }}
            onClick={() => setSepetAcik(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl anim-sheet-up"
            style={{
              background: 'hsl(46 56% 89%)',
              maxHeight: '82%',
              boxShadow: '0 -12px 48px -8px rgba(18,10,5,0.4)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: 'hsl(38 42% 62%)' }}
              />
            </div>
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-b"
              style={{ borderColor: 'hsl(38 42% 72%)' }}
            >
              <h2
                className="font-serif text-xl text-foreground"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                Sepetim
              </h2>
              <button
                type="button"
                onClick={() => setSepetAcik(false)}
                className="size-9 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground transition"
                aria-label="Sepeti kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <SepetIcerik onKapat={() => setSepetAcik(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

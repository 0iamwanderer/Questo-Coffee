'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt } from 'lucide-react';
import { MenuListesi } from '@/components/musteri/menu-listesi';
import { SepetCekmecesi } from '@/components/musteri/sepet-cekmecesi';
import { KvkkBildirim } from '@/components/musteri/kvkk-bildirim';
import { cn } from '@/lib/utils';
import { useMasa } from './masa-provider';
import { Landing } from './landing';

type AkisDurumu = 'landing' | 'opening' | 'menu' | 'closing';
const KAPAK_SURE_MS = 700;

const ziyaretAnahtar = (token: string) => `questo-landing-gorulmus-${token}`;

export function MusteriAkisi() {
  const { masaToken, restoranAd, masaAd } = useMasa();
  const [durum, setDurum] = useState<AkisDurumu>('landing');

  // İlk ziyarette landing'i göster; sonraki ziyaretlerde direkt menüye geç.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const k = ziyaretAnahtar(masaToken);
    if (localStorage.getItem(k) === '1') {
      setDurum('menu');
    } else {
      localStorage.setItem(k, '1');
    }
  }, [masaToken]);

  const menuyeGec = () => {
    if (durum !== 'landing') return;
    setDurum('opening');
    setTimeout(() => setDurum('menu'), KAPAK_SURE_MS);
  };

  const landingeDon = () => {
    if (durum !== 'menu') return;
    setDurum('closing');
    setTimeout(() => setDurum('landing'), KAPAK_SURE_MS);
  };

  const gecisYapiyor = durum === 'opening' || durum === 'closing';
  const landingGoruluyor = durum === 'landing' || gecisYapiyor;
  const menuGoruluyor = durum === 'menu' || gecisYapiyor;

  return (
    <div
      className="relative h-[100dvh] overflow-hidden"
      style={{ perspective: 1800, perspectiveOrigin: '50% 45%' }}
    >
      {/* Menü — kapak açıkken altta görünür */}
      {menuGoruluyor && (
        <div className="absolute inset-0">
          <MenuEkrani onBack={landingeDon} restoranAd={restoranAd} masaAd={masaAd} masaToken={masaToken} />
        </div>
      )}

      {/* Landing kapağı — sol omurga etrafında döner */}
      {landingGoruluyor && (
        <div
          className={cn(
            'absolute inset-0',
            durum === 'opening' && 'anim-cover-open',
            durum === 'closing' && 'anim-cover-close',
          )}
          style={{
            transformOrigin: 'left center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow: gecisYapiyor
              ? '12px 0 38px -10px rgba(20,12,6,0.35)'
              : 'none',
            willChange: gecisYapiyor ? 'transform' : 'auto',
            pointerEvents: durum === 'landing' ? 'auto' : 'none',
          }}
        >
          <Landing onEnter={menuyeGec} />
        </div>
      )}

      <KvkkBildirim masaToken={masaToken} />
    </div>
  );
}

function MenuEkrani({
  onBack,
  restoranAd,
  masaAd,
  masaToken,
}: {
  onBack: () => void;
  restoranAd: string;
  masaAd: string;
  masaToken: string;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Üst nav: back / orta marka / adisyon */}
      <header className="flex items-center justify-between gap-2 px-4 pt-11 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Ana sayfaya dön"
          className="inline-flex size-10 items-center justify-center rounded-full bg-card shadow-soft transition active:scale-95"
        >
          <ArrowLeft className="size-[18px]" />
        </button>

        <div className="flex flex-col items-center leading-tight">
          <div className="font-serif text-[20px]">{restoranAd}</div>
          <div className="micro-caps text-muted-foreground">
            Menü · {masaAd}
          </div>
        </div>

        <Link
          href={`/m/${masaToken}/adisyon`}
          aria-label="Adisyonum"
          className="inline-flex size-10 items-center justify-center rounded-full bg-card shadow-soft transition active:scale-95"
        >
          <Receipt className="size-[18px]" />
        </Link>
      </header>

      {/* Menü içerik (kategoriler + ürünler) */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <MenuListesi />
      </div>

      <SepetCekmecesi />
    </div>
  );
}

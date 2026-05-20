'use client';

import { useEffect, useState } from 'react';
import { MenuListesi } from '@/components/musteri/menu-listesi';
import { KvkkBildirim } from '@/components/musteri/kvkk-bildirim';
import { cn } from '@/lib/utils';
import { useMasa } from './masa-provider';
import { Landing } from './landing';

type AkisDurumu = 'landing' | 'opening' | 'menu' | 'closing';
const KAPAK_SURE_MS = 700;


export function MusteriAkisi() {
  const { masaToken } = useMasa();
  const [durum, setDurum] = useState<AkisDurumu>('landing');

  // Sonraki ziyaretlerde direkt menüye geç.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const k = `questo-landing-${masaToken}`;
    if (localStorage.getItem(k) === '1') setDurum('menu');
    else localStorage.setItem(k, '1');
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
          <MenuListesi onBack={landingeDon} />
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

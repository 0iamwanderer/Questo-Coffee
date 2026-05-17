'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { anonGirisiSagla } from '@/lib/auth/anon';
import { getClientApp } from '@/lib/firebase/client';
import { useSepet } from '@/stores/sepet';

export interface MasaBilgi {
  masaId: string;
  masaAd: string;
  masaToken: string;
  restoranAd: string;
}

const Ctx = createContext<MasaBilgi | null>(null);

export function MasaSaglayici({
  masa,
  children,
}: {
  masa: MasaBilgi;
  children: React.ReactNode;
}) {
  const masaAyarla = useSepet((s) => s.masaAyarla);
  const [musteriHazir, setMusteriHazir] = useState(false);

  useEffect(() => {
    getClientApp(); // App Check başlatma
    masaAyarla(masa.masaToken);
    anonGirisiSagla()
      .then(() => setMusteriHazir(true))
      .catch((e) => console.error('[questo] anon auth hata:', e));
  }, [masa.masaToken, masaAyarla]);

  return (
    <Ctx.Provider value={masa}>
      {!musteriHazir && (
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/30"
        />
      )}
      {children}
    </Ctx.Provider>
  );
}

export const useMasa = (): MasaBilgi => {
  const v = useContext(Ctx);
  if (!v) throw new Error('MasaSaglayici dışında useMasa kullanılamaz.');
  return v;
};

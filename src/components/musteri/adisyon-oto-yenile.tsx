'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

/**
 * Adisyon ve alt-koleksiyonlarındaki (siparişler, ödemeTalepleri)
 * değişikliklere abone olur ve `router.refresh()` çağırır.
 * Görsel UI üretmez — yalnız listener.
 */
export function AdisyonOtoYenile({ adisyonId }: { adisyonId: string }) {
  const router = useRouter();
  // İlk snapshot mount'ta zaten geliyor; o anki refresh gereksiz
  const ilkAtlandi = useRef({ adisyon: false, siparis: false, talep: false });

  useEffect(() => {
    const db = getClientDb();
    const aRef = doc(db, `restoranlar/${RESTORAN}/adisyonlar/${adisyonId}`);
    const siparisRef = collection(
      db,
      `restoranlar/${RESTORAN}/adisyonlar/${adisyonId}/siparisler`,
    );
    const talepRef = collection(
      db,
      `restoranlar/${RESTORAN}/adisyonlar/${adisyonId}/odemeTalepleri`,
    );

    const yenile = (anahtar: keyof typeof ilkAtlandi.current) => () => {
      if (!ilkAtlandi.current[anahtar]) {
        ilkAtlandi.current[anahtar] = true;
        return;
      }
      router.refresh();
    };

    const u1 = onSnapshot(aRef, yenile('adisyon'), () => {});
    const u2 = onSnapshot(siparisRef, yenile('siparis'), () => {});
    const u3 = onSnapshot(talepRef, yenile('talep'), () => {});

    return () => {
      u1();
      u2();
      u3();
    };
  }, [adisyonId, router]);

  return null;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import { siparisConverter } from '@/lib/firebase/converters';
import { yeniSiparisSesi } from '@/lib/ses/audio-unlock';
import type { Siparis, SiparisDurumu } from '@/types/model';
import { KanbanKolon } from './kanban-kolon';

const AKTIF: SiparisDurumu[] = ['yeni', 'hazirlaniyor', 'hazir'];
const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

export function KanbanPanosu() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const ilkYuk = useRef(true);
  const gorulen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collectionGroup(getClientDb(), 'siparisler').withConverter(
        siparisConverter,
      ),
      where('durum', 'in', AKTIF),
      orderBy('olusturulduAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const liste: Siparis[] = [];
        // Yalnız bu restoranın siparişleri (collectionGroup geneldir)
        snap.docs.forEach((d) => {
          // path: restoranlar/{R}/adisyonlar/{aId}/siparisler/{sId}
          if (d.ref.path.startsWith(`restoranlar/${RESTORAN}/`)) {
            liste.push(d.data());
          }
        });

        if (!ilkYuk.current) {
          const yeniGelen = liste.find(
            (s) => s.durum === 'yeni' && !gorulen.current.has(s.id),
          );
          if (yeniGelen) yeniSiparisSesi();
        }
        liste.forEach((s) => gorulen.current.add(s.id));
        ilkYuk.current = false;
        setSiparisler(liste);
        setHata(null);
      },
      (e) => {
        console.error('[questo] kanban onSnapshot hata:', e);
        setHata(
          e.code === 'failed-precondition'
            ? 'Firestore index oluşturuluyor. Birkaç dakika sonra deneyin.'
            : 'Siparişler dinlenemiyor: ' + e.message,
        );
      },
    );

    return () => unsub();
  }, []);

  const grup = (durum: SiparisDurumu) =>
    siparisler.filter((s) => s.durum === durum);

  return (
    <div className="space-y-3">
      {hata && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {hata}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KanbanKolon baslik="Yeni" durum="yeni" siparisler={grup('yeni')} />
        <KanbanKolon
          baslik="Hazırlanıyor"
          durum="hazirlaniyor"
          siparisler={grup('hazirlaniyor')}
        />
        <KanbanKolon baslik="Hazır" durum="hazir" siparisler={grup('hazir')} />
      </div>
    </div>
  );
}

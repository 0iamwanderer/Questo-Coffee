'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientAuth, getClientDb } from '@/lib/firebase/client';
import { siparisConverter } from '@/lib/firebase/converters';
import { yeniSiparisSesi } from '@/lib/ses/audio-unlock';
import type { Siparis, SiparisDurumu } from '@/types/model';
import { KanbanKolon } from './kanban-kolon';

const AKTIF: SiparisDurumu[] = ['yeni', 'hazirlaniyor', 'hazir'];
const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;
const FLASH_SURE_MS = 1400;

export function KanbanPanosu() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [authHazir, setAuthHazir] = useState(false);
  const ilkYuk = useRef(true);
  const gorulen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(getClientAuth(), async (u) => {
      if (u) await u.getIdToken(true); // claims'lerin token'a yazılmasını garantile
      setAuthHazir(!!u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authHazir) return;
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
        snap.docs.forEach((d) => {
          if (d.ref.path.startsWith(`restoranlar/${RESTORAN}/`)) {
            liste.push(d.data());
          }
        });

        if (!ilkYuk.current) {
          // Bu batch'te yeni gelen siparişler (henüz görülmemiş)
          const yeniIdler = liste
            .filter((s) => !gorulen.current.has(s.id))
            .map((s) => s.id);

          if (yeniIdler.length > 0) {
            yeniSiparisSesi();
            // Flash ekle
            setFlashIds((prev) => {
              const yeni = new Set(prev);
              yeniIdler.forEach((id) => yeni.add(id));
              return yeni;
            });
            // Flash süresi sonunda temizle
            setTimeout(() => {
              setFlashIds((prev) => {
                const yeni = new Set(prev);
                yeniIdler.forEach((id) => yeni.delete(id));
                return yeni;
              });
            }, FLASH_SURE_MS);
          }
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
  }, [authHazir]);

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
        <KanbanKolon
          baslik="Yeni"
          durum="yeni"
          siparisler={grup('yeni')}
          flashIds={flashIds}
        />
        <KanbanKolon
          baslik="Hazırlanıyor"
          durum="hazirlaniyor"
          siparisler={grup('hazirlaniyor')}
          flashIds={flashIds}
        />
        <KanbanKolon
          baslik="Hazır"
          durum="hazir"
          siparisler={grup('hazir')}
          flashIds={flashIds}
        />
      </div>
    </div>
  );
}

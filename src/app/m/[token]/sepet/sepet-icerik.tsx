'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { getClientAuth, getClientDb } from '@/lib/firebase/client';
import { urunConverter } from '@/lib/firebase/converters';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { useMasa } from '../masa-provider';
import { anonGirisiSagla } from '@/lib/auth/anon';
import type { Urun } from '@/types/model';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

export function SepetIcerik() {
  const router = useRouter();
  const { masaToken, masaAd } = useMasa();
  const kalemler = useSepet((s) => s.kalemler);
  const guncelle = useSepet((s) => s.guncelle);
  const cikar = useSepet((s) => s.cikar);
  const notGuncelle = useSepet((s) => s.notGuncelle);
  const temizle = useSepet((s) => s.temizle);

  const [urunler, setUrunler] = useState<Map<string, Urun>>(new Map());
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const db = getClientDb();
    const q = query(
      collection(db, `restoranlar/${RESTORAN}/urunler`).withConverter(
        urunConverter,
      ),
    );
    const unsub = onSnapshot(q, (snap) => {
      const m = new Map<string, Urun>();
      snap.docs.forEach((d) => m.set(d.id, d.data()));
      setUrunler(m);
    });
    return () => unsub();
  }, []);

  // Yalnız görüntüleme için tahmini toplam — gerçek toplam sunucu hesaplar.
  const tahminiToplam = useMemo(
    () =>
      kalemler.reduce((a, k) => {
        const u = urunler.get(k.urunId);
        return a + (u ? u.fiyatKurus * k.adet : 0);
      }, 0),
    [kalemler, urunler],
  );

  const gonder = async () => {
    setHata(null);
    setGonderiliyor(true);
    try {
      const user = await anonGirisiSagla();
      const idToken = await user.getIdToken();

      const res = await fetch('/api/siparis', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          masaToken,
          kalemler: kalemler.map((k) => ({
            urunId: k.urunId,
            adet: k.adet,
            ...(k.notlar ? { notlar: k.notlar } : {}),
          })),
        }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Sipariş gönderilemedi.');
      }

      temizle();
      toast.success('Siparişiniz alındı.');
      router.replace(`/m/${masaToken}/adisyon?yeni=1`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sipariş gönderilemedi.';
      setHata(msg);
      toast.error(msg);
    } finally {
      setGonderiliyor(false);
    }
  };

  if (kalemler.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href={`/m/${masaToken}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Menüye dön
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Sepetiniz boş.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/m/${masaToken}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Menü
        </Link>
        <h1 className="text-lg font-semibold">Sepet · {masaAd}</h1>
      </div>

      <ul className="space-y-2">
        {kalemler.map((k) => {
          const u = urunler.get(k.urunId);
          const yok = !u;
          const tukenmis = u && !u.stoktaMi;
          return (
            <li
              key={k.urunId}
              className="rounded-lg border bg-card p-3 space-y-2"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight">
                    {u?.ad ?? 'Ürün bulunamadı'}
                  </div>
                  {!yok && (
                    <div className="text-sm text-muted-foreground">
                      {formatTL(u.fiyatKurus)} × {k.adet} ={' '}
                      <span className="text-foreground font-medium">
                        {formatTL(u.fiyatKurus * k.adet)}
                      </span>
                    </div>
                  )}
                  {(yok || tukenmis) && (
                    <p className="mt-1 text-xs text-destructive">
                      {yok
                        ? 'Bu ürün artık menüde yok.'
                        : 'Ürün stokta yok.'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Sepetten çıkar"
                  onClick={() => cikar(k.urunId)}
                  className="p-1.5 text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-md border bg-background">
                  <button
                    type="button"
                    aria-label="Azalt"
                    onClick={() => guncelle(k.urunId, k.adet - 1)}
                    className="p-1.5"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-5 text-center text-sm tabular-nums">
                    {k.adet}
                  </span>
                  <button
                    type="button"
                    aria-label="Arttır"
                    onClick={() => guncelle(k.urunId, k.adet + 1)}
                    className="p-1.5"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Not (örn. az şekerli)"
                value={k.notlar ?? ''}
                maxLength={200}
                onChange={(e) =>
                  notGuncelle(k.urunId, e.target.value || undefined)
                }
                className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tahmini toplam</span>
          <span className="font-semibold">{formatTL(tahminiToplam)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Gerçek toplam siparişiniz onaylanırken sunucuda hesaplanır.
        </p>
      </div>

      {hata && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {hata}
        </p>
      )}

      <button
        type="button"
        onClick={gonder}
        disabled={gonderiliyor}
        className="w-full rounded-md bg-primary px-3 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {gonderiliyor ? 'Gönderiliyor…' : 'Siparişi gönder'}
      </button>
    </div>
  );
}

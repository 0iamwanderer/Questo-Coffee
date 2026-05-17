'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import { urunConverter } from '@/lib/firebase/converters';
import { formatTL } from '@/lib/utils/para';
import { useSepet, type SepetKalemi } from '@/stores/sepet';
import { useMasa } from '../masa-provider';
import { anonGirisiSagla } from '@/lib/auth/anon';
import type { Urun } from '@/types/model';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

const kalemBirimFiyat = (
  urun: Urun | undefined,
  kalem: SepetKalemi,
): number => {
  if (!urun) return 0;
  let ek = 0;
  for (const sec of kalem.secimler ?? []) {
    const grup = urun.opsiyonGruplari?.find((g) => g.id === sec.grupId);
    if (!grup) continue;
    for (const id of sec.secenekIds) {
      const sc = grup.secenekler.find((s) => s.id === id);
      if (sc) ek += sc.ekFiyatKurus;
    }
  }
  return urun.fiyatKurus + ek;
};

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
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

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

  const tahminiToplam = useMemo(
    () =>
      kalemler.reduce((a, k) => {
        const u = urunler.get(k.urunId);
        return a + kalemBirimFiyat(u, k) * k.adet;
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
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          masaToken,
          kalemler: kalemler.map((k) => ({
            urunId: k.urunId,
            adet: k.adet,
            ...(k.notlar ? { notlar: k.notlar } : {}),
            ...(k.secimler && k.secimler.length > 0
              ? { secimler: k.secimler }
              : {}),
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
      <div className="space-y-6 anim-fade-in">
        <Link
          href={`/m/${masaToken}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Menüye dön
        </Link>
        <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
          <p className="font-serif text-2xl">Sepetiniz boş</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Menüden ürün ekleyerek başlayın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 anim-fade-in pb-32 pt-4 px-4">
      <div className="space-y-2">
        <Link
          href={`/m/${masaToken}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Menü
        </Link>
        <div className="space-y-0.5">
          <p className="micro-caps text-muted-foreground">{masaAd}</p>
          <h1 className="font-serif text-3xl leading-none">Sepetim</h1>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {kalemler.map((k) => {
          const u = urunler.get(k.urunId);
          const yok = !u;
          const tukenmis = u && !u.stoktaMi;
          const birimFiyat = kalemBirimFiyat(u, k);
          return (
            <li key={k.satirId} className="py-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg leading-tight">
                    {u?.ad ?? 'Ürün bulunamadı'}
                  </div>
                  {k.secimler && k.secimler.length > 0 && u && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {k.secimler.map((sec, i) => {
                        const grup = u.opsiyonGruplari?.find(
                          (g) => g.id === sec.grupId,
                        );
                        if (!grup) return null;
                        const adlar = sec.secenekIds
                          .map(
                            (id) =>
                              grup.secenekler.find((sc) => sc.id === id)?.ad,
                          )
                          .filter(Boolean)
                          .join(', ');
                        return (
                          <li key={`${k.satirId}-${i}`}>
                            <span className="font-medium text-foreground/70">
                              {grup.ad}:
                            </span>{' '}
                            {adlar}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!yok && (
                    <div className="mt-1 text-sm text-muted-foreground tabular-nums">
                      {formatTL(birimFiyat)} × {k.adet}
                      <span className="mx-1.5">·</span>
                      <span className="text-foreground font-medium">
                        {formatTL(birimFiyat * k.adet)}
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
                  onClick={() => cikar(k.satirId)}
                  className="rounded-full p-2 text-muted-foreground transition active:scale-90"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border bg-card px-1 shadow-soft">
                <button
                  type="button"
                  aria-label="Azalt"
                  onClick={() => guncelle(k.satirId, k.adet - 1)}
                  className="rounded-full p-1.5 transition active:scale-90"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-5 text-center text-sm font-medium tabular-nums">
                  {k.adet}
                </span>
                <button
                  type="button"
                  aria-label="Arttır"
                  onClick={() => guncelle(k.satirId, k.adet + 1)}
                  className="rounded-full p-1.5 transition active:scale-90"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Not (örn. az şekerli)"
                value={k.notlar ?? ''}
                maxLength={200}
                onChange={(e) =>
                  notGuncelle(k.satirId, e.target.value || undefined)
                }
                className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </li>
          );
        })}
      </ul>

      {hata && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {hata}
        </p>
      )}

      {/* Sticky alt CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="mx-auto max-w-md space-y-2 rounded-3xl border bg-card/95 p-3 shadow-floating backdrop-blur">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Toplam</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatTL(tahminiToplam)}
            </span>
          </div>
          <button
            type="button"
            onClick={gonder}
            disabled={gonderiliyor}
            className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-50"
          >
            {gonderiliyor ? 'Gönderiliyor…' : 'Siparişi gönder'}
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            Toplam sunucuda yeniden hesaplanır. Ödeme kasada alınır.
          </p>
        </div>
      </div>
    </div>
  );
}

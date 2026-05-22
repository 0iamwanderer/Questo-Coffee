'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, doc, getDoc } from 'firebase/firestore';
// collection: urunConverter için gerekli (withConverter zinciri)
import { getClientDb } from '@/lib/firebase/client';
import { urunConverter } from '@/lib/firebase/converters';
import { formatTL } from '@/lib/utils/para';
import { useSepet, type SepetKalemi } from '@/stores/sepet';
import { useMasa } from '../masa-provider';
import { anonGirisiSagla, anonYenile } from '@/lib/auth/anon';
import { Konfeti } from '@/components/musteri/konfeti';
import { Tamamlayicilar } from '@/components/musteri/tamamlayicilar';
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

export function SepetIcerik({ onKapat }: { onKapat?: () => void } = {}) {
  const router = useRouter();
  const { masaToken, masaAd } = useMasa();
  const kalemler = useSepet((s) => s.kalemler);
  const guncelle = useSepet((s) => s.guncelle);
  const cikar = useSepet((s) => s.cikar);
  const notGuncelle = useSepet((s) => s.notGuncelle);
  const temizle = useSepet((s) => s.temizle);
  const musteriAd = useSepet((s) => s.musteriAd);
  const musteriAdAyarla = useSepet((s) => s.musteriAdAyarla);

  const [urunler, setUrunler] = useState<Map<string, Urun>>(new Map());
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [konfetiAktif, setKonfetiAktif] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // Tüm ürün koleksiyonunu dinlemek yerine sadece sepetteki ürünleri fetch et
  useEffect(() => {
    if (kalemler.length === 0) return;
    const db = getClientDb();
    const urunIds = [...new Set(kalemler.map((k) => k.urunId))];
    Promise.all(
      urunIds.map((id) =>
        getDoc(
          doc(collection(db, `restoranlar/${RESTORAN}/urunler`).withConverter(urunConverter), id),
        ),
      ),
    ).then((snaps) => {
      const m = new Map<string, Urun>();
      snaps.forEach((s) => { if (s.exists()) m.set(s.id, s.data()); });
      setUrunler(m);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalemler.map((k) => k.urunId).join(',')]);

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
      const siparisBody = JSON.stringify({
        masaToken,
        kalemler: kalemler.map((k) => ({
          urunId: k.urunId,
          adet: k.adet,
          ...(k.notlar ? { notlar: k.notlar } : {}),
          ...(k.secimler && k.secimler.length > 0
            ? { secimler: k.secimler }
            : {}),
        })),
        ...(musteriAd ? { musteriAd } : {}),
      });

      const postSiparis = async (idToken: string) =>
        fetch('/api/siparis', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${idToken}`,
            'idempotency-key': idempotencyKey,
          },
          body: siparisBody,
        });

      let user = await anonGirisiSagla();
      let idToken = await user.getIdToken();
      let res = await postSiparis(idToken);

      // 401: token revoked/expired (emulator yeniden başlatıldı vb.)
      // Yeni anonim kullanıcı aç ve bir kez daha dene.
      if (res.status === 401) {
        user = await anonYenile();
        idToken = await user.getIdToken(/* forceRefresh= */ true);
        res = await postSiparis(idToken);
      }

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          kod?: string;
          mesaj?: string;
        };
        if (res.status === 404 || j.kod === 'masa_yok') {
          throw new Error(
            'Masa bağlantısı sona ermiş. Sayfayı yenileyip tekrar deneyin.',
          );
        }
        throw new Error(j.mesaj ?? 'Sipariş gönderilemedi.');
      }

      // Konfetiyi göster, kısa süre bekle, sonra adisyona git
      setKonfetiAktif(true);
      toast.success('Siparişiniz alındı.');
      setTimeout(() => {
        temizle();
        router.replace(`/m/${masaToken}/adisyon?yeni=1`);
      }, 1400);
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
      <div className="space-y-6 anim-fade-in px-4 pt-4">
        {onKapat ? (
          <button
            type="button"
            onClick={onKapat}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Menüye dön
          </button>
        ) : (
          <Link
            href={`/m/${masaToken}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Menüye dön
          </Link>
        )}
        <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
          <svg
            aria-hidden
            viewBox="0 0 120 100"
            className="mx-auto mb-4 h-24 w-28 text-primary/35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M40 18 Q42 12 38 8"
              className="anim-pulse-soft"
              opacity="0.7"
            />
            <path
              d="M52 18 Q54 10 50 6"
              className="anim-pulse-soft"
              opacity="0.5"
              style={{ animationDelay: '0.6s' }}
            />
            <path
              d="M64 18 Q66 12 62 8"
              className="anim-pulse-soft"
              opacity="0.7"
              style={{ animationDelay: '1.1s' }}
            />
            <path d="M22 34 L82 34 L78 78 Q78 84 72 84 L32 84 Q26 84 26 78 Z" />
            <path d="M82 44 Q98 44 98 58 Q98 72 82 72" />
            <ellipse cx="52" cy="92" rx="42" ry="4" />
          </svg>
          <p className="font-serif text-2xl">Sepetiniz boş</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Menüden bir şeyler eklemeye ne dersiniz?
          </p>
          <Link
            href={`/m/${masaToken}`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-soft"
          >
            Menüye git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 anim-fade-in pb-32 pt-4 px-4">
      <div className="space-y-3">
        {onKapat ? (
          <button
            type="button"
            onClick={onKapat}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Menü
          </button>
        ) : (
          <Link
            href={`/m/${masaToken}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Menü
          </Link>
        )}
        <div className="space-y-1">
          <p className="micro-caps text-muted-foreground">{masaAd}</p>
          <h1 className="font-serif text-4xl leading-none">Sepetim</h1>
        </div>
      </div>

      <ul className="space-y-2">
        {kalemler.map((k, i) => {
          const u = urunler.get(k.urunId);
          const yok = !u;
          const tukenmis = u && !u.stoktaMi;
          const birimFiyat = kalemBirimFiyat(u, k);
          return (
            <li
              key={k.satirId}
              className="anim-rise rounded-2xl border bg-card p-4 space-y-2 shadow-soft"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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

      {/* İsim alanı — hesap ayırma için */}
      <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-2">
        <label className="block text-sm font-medium" htmlFor="musteri-ad">
          Adınız{' '}
          <span className="font-normal text-muted-foreground">
            (isteğe bağlı)
          </span>
        </label>
        <input
          id="musteri-ad"
          type="text"
          inputMode="text"
          autoComplete="given-name"
          placeholder="Ali, Ayşe…"
          value={musteriAd ?? ''}
          maxLength={50}
          onChange={(e) =>
            musteriAdAyarla(e.target.value.trim() || null)
          }
          className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Adınız siparişinize eklenir; hesap ayırırken kişiye göre
          gruplama yapılır.
        </p>
      </div>

      {/* Cross-sell: sepete eklemediği ürünlerden öneri */}
      <Tamamlayicilar
        urunler={Array.from(urunler.values())}
        sepetUrunIds={new Set(kalemler.map((k) => k.urunId))}
      />

      {hata && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {hata}
        </p>
      )}

      <Konfeti aktif={konfetiAktif} />

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

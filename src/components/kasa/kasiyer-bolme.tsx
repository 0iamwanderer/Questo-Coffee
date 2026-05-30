'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus, Users } from 'lucide-react';
import { formatTL } from '@/lib/utils/para';
import type { SiparisDurumu } from '@/types/model';

interface KalemOzet {
  ad: string;
  adet: number;
  araToplamKurus: number;
}

interface SiparisOzet {
  id: string;
  gunlukNo: number;
  durum: SiparisDurumu;
  musteriAd?: string;
  kalemler: KalemOzet[];
  toplamKurus: number;
}

interface Props {
  adisyonId: string;
  /** Adisyonun kalan (ödenmemiş) tutarı. */
  toplamKurus: number;
  /** Adisyonun değişmeyen genel toplamı — "Kişi başı" sabit gösterimi için. */
  genelToplamKurus: number;
  siparisler: SiparisOzet[];
}

type Sekme = 'esit' | 'urun';

export function KasiyerBolme({
  adisyonId,
  toplamKurus,
  genelToplamKurus,
  siparisler,
}: Props) {
  const router = useRouter();
  const [aktifSekme, setAktifSekme] = useState<Sekme>('esit');
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [odenenSayisi, setOdenenSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  // Adisyon tamamen ödendiyse (kalan = 0) ödeme alanı yerine "Tamamen ödendi"
  // durumu gösterilir; 0 tutarlı talep oluşmaz.
  const tamamenOdendi = toplamKurus <= 0;

  const aktifSiparisler = siparisler.filter((s) => s.durum !== 'iptal');

  // Tüm aktif sipariş kalemleri (teslim durumu fark etmeksizin)
  const tumKalemler = aktifSiparisler.flatMap((s) =>
    s.kalemler.map((k, i) => ({
      key: `${s.id}-${i}`,
      siparisId: s.id,
      siparisNo: s.gunlukNo,
      musteriAd: s.musteriAd,
      ad: k.ad,
      adet: k.adet,
      araToplamKurus: k.araToplamKurus,
    })),
  );

  const seciliToplam = Array.from(secili).reduce((acc, key) => {
    const item = tumKalemler.find((k) => k.key === key);
    return acc + (item?.araToplamKurus ?? 0);
  }, 0);

  // Kişi başı, KALAN değil değişmeyen GENEL toplam üzerinden sabit hesaplanır;
  // bir kişi ödeyince bekleyenlerin tutarı düşmüş gibi görünmez.
  const kisiPayi = Math.ceil(genelToplamKurus / kisiSayisi);

  const toggleSecili = (key: string) => {
    setSecili((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const talep = async (
    body: Record<string, unknown>,
    anahtarId: string,
    onSuccess?: () => void,
  ) => {
    setYukleniyor(anahtarId);
    setHata(null);
    try {
      const res = await fetch(`/api/adisyon/${adisyonId}/kasiyer-talep`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? `HTTP ${res.status}`);
      }
      onSuccess?.();
      router.refresh();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setYukleniyor(null);
    }
  };

  const esitDilimOde = () => {
    if (tamamenOdendi) return; // 0 tutarlı talep guard'ı
    const anahtar = `esit-${odenenSayisi}`;
    talep({ yontem: 'esit', kisiSayisi }, anahtar, () =>
      setOdenenSayisi((n) => n + 1),
    );
  };

  const urunOde = () => {
    if (tamamenOdendi) return; // 0 tutarlı talep guard'ı
    const kalemler = Array.from(secili).flatMap((key) => {
      const item = tumKalemler.find((k) => k.key === key);
      if (!item) return [];
      return [{
        siparisId: item.siparisId,
        siparisNo: item.siparisNo,
        ad: item.ad,
        adet: item.adet,
        araToplamKurus: item.araToplamKurus,
      }];
    });
    if (kalemler.length === 0) return;
    const secimToplam = kalemler.reduce((acc, k) => acc + k.araToplamKurus, 0);
    if (secimToplam <= 0) return; // 0 tutarlı talep guard'ı
    talep(
      { yontem: 'urun', secilenKalemler: kalemler },
      `urun-${Date.now()}`,
      () => setSecili(new Set()),
    );
  };

  const sekmeler: { id: Sekme; etiket: string }[] = [
    { id: 'esit', etiket: 'Eşit Böl' },
    { id: 'urun', etiket: 'Ürün Seç' },
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Users className="size-4" />
        Ödemeyi Al
      </div>

      {hata && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {hata}
        </p>
      )}

      {tamamenOdendi ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <Check className="size-4 shrink-0" />
          Adisyon tamamen ödendi. Aşağıdan adisyonu kapatabilirsiniz.
        </div>
      ) : (
        <>
          {/* Sekme seçici */}
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {sekmeler.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setAktifSekme(s.id)}
            className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
              aktifSekme === s.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {s.etiket}
          </button>
        ))}
      </div>

      {/* ─── Eşit Böl ────────────────────────────────── */}
      {aktifSekme === 'esit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kişi sayısı</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setKisiSayisi((k) => Math.max(1, k - 1))}
                disabled={kisiSayisi <= 1}
                className="flex size-7 items-center justify-center rounded-full border disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-medium tabular-nums">
                {kisiSayisi}
              </span>
              <button
                type="button"
                onClick={() => setKisiSayisi((k) => Math.min(20, k + 1))}
                className="flex size-7 items-center justify-center rounded-full border"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Toplam</span>
              <span>{formatTL(genelToplamKurus)}</span>
            </div>
            <div className="flex justify-between font-medium mt-1">
              <span>Kişi başı</span>
              <span>{formatTL(kisiPayi)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {Array.from({ length: kisiSayisi }).map((_, i) => {
              const odendi = i < odenenSayisi;
              const aktif = i === odenenSayisi;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {i + 1}. kişi — {formatTL(kisiPayi)}
                  </span>
                  {odendi ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                      <Check className="size-3" /> Ödendi
                    </span>
                  ) : aktif ? (
                    <button
                      type="button"
                      onClick={esitDilimOde}
                      disabled={!!yukleniyor}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {yukleniyor ? '…' : 'Ödeme al'}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">bekliyor</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Ürün Seç ────────────────────────────────── */}
      {aktifSekme === 'urun' && (
        <div className="space-y-2">
          {tumKalemler.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Henüz sipariş kalemi yok.
            </p>
          ) : (
            <>
              <ul className="max-h-56 space-y-0.5 overflow-y-auto">
                {aktifSiparisler.map((s) => (
                  <li key={s.id}>
                    <p className="px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {s.musteriAd
                        ? `${s.musteriAd} — #${s.gunlukNo}`
                        : `Sipariş #${s.gunlukNo}`}
                    </p>
                    {s.kalemler.map((k, i) => {
                      const key = `${s.id}-${i}`;
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={secili.has(key)}
                            onChange={() => toggleSecili(key)}
                            className="size-4 rounded"
                          />
                          <span className="flex-1 text-sm">
                            <span className="tabular-nums text-muted-foreground">
                              {k.adet}×
                            </span>{' '}
                            {k.ad}
                          </span>
                          <span className="text-sm tabular-nums">
                            {formatTL(k.araToplamKurus)}
                          </span>
                        </label>
                      );
                    })}
                  </li>
                ))}
              </ul>

              {secili.size > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium">
                    {formatTL(seciliToplam)}
                  </span>
                  <button
                    type="button"
                    onClick={urunOde}
                    disabled={!!yukleniyor}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {yukleniyor ? '…' : 'Ödeme al'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, Minus, Plus, Users } from 'lucide-react';
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
  toplamKurus: number;
  siparisler: SiparisOzet[];
}

type Sekme = 'kisi' | 'esit' | 'urun';

interface KisiGrubu {
  ad: string | null;
  toplam: number;
  teslimEdildi: boolean;
  kalemler: Array<{
    siparisId: string;
    siparisNo: number;
    ad: string;
    adet: number;
    araToplamKurus: number;
  }>;
}

export function KasiyerBolme({ adisyonId, toplamKurus, siparisler }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [odenenler, setOdenenler] = useState<Set<string>>(new Set());
  const [odenenSayisi, setOdenenSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const aktifSiparisler = siparisler.filter((s) => s.durum !== 'iptal');

  const kisiGruplari = useMemo<KisiGrubu[]>(() => {
    const map = new Map<string, KisiGrubu>();
    for (const s of aktifSiparisler) {
      const anahtar = s.musteriAd ?? '__adsiz__';
      const mevcut = map.get(anahtar) ?? {
        ad: s.musteriAd ?? null,
        toplam: 0,
        teslimEdildi: true,
        kalemler: [],
      };
      mevcut.toplam += s.toplamKurus;
      if (s.durum !== 'teslim') mevcut.teslimEdildi = false;
      for (const k of s.kalemler) {
        mevcut.kalemler.push({
          siparisId: s.id,
          siparisNo: s.gunlukNo,
          ad: k.ad,
          adet: k.adet,
          araToplamKurus: k.araToplamKurus,
        });
      }
      map.set(anahtar, mevcut);
    }
    return Array.from(map.values());
  }, [aktifSiparisler]);

  const adliGrup = kisiGruplari.some((g) => g.ad !== null);
  const tumTeslimEdildi = aktifSiparisler.every((s) => s.durum === 'teslim');

  const [aktifSekme, setAktifSekme] = useState<Sekme>(
    adliGrup ? 'kisi' : 'esit',
  );

  // Ürün Seç: yalnızca teslim edilmiş sipariş kalemleri seçilebilir
  const teslimSiparisler = aktifSiparisler.filter((s) => s.durum === 'teslim');
  const bekleyenSiparisler = aktifSiparisler.filter(
    (s) => s.durum !== 'teslim',
  );

  const teslimKalemler = teslimSiparisler.flatMap((s) =>
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
    const item = teslimKalemler.find((k) => k.key === key);
    return acc + (item?.araToplamKurus ?? 0);
  }, 0);

  const kisiPayi = Math.ceil(toplamKurus / kisiSayisi);

  const toggleSecili = (key: string) =>
    setSecili((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
      setOdenenler((prev) => new Set([...prev, anahtarId]));
      onSuccess?.();
      router.refresh();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setYukleniyor(null);
    }
  };

  const kisiOde = (grup: KisiGrubu) => {
    const anahtar = grup.ad ?? '__adsiz__';
    talep(
      {
        yontem: 'urun',
        secilenKalemler: grup.kalemler,
        ...(grup.ad ? { musteriAd: grup.ad } : {}),
      },
      anahtar,
    );
  };

  const esitDilimOde = () => {
    const anahtar = `esit-${odenenSayisi}`;
    talep({ yontem: 'esit', kisiSayisi }, anahtar, () =>
      setOdenenSayisi((n) => n + 1),
    );
  };

  const urunOde = () => {
    const kalemler = Array.from(secili).map((key) => {
      const item = teslimKalemler.find((k) => k.key === key)!;
      return {
        siparisId: item.siparisId,
        siparisNo: item.siparisNo,
        ad: item.ad,
        adet: item.adet,
        araToplamKurus: item.araToplamKurus,
      };
    });
    talep(
      { yontem: 'urun', secilenKalemler: kalemler },
      `urun-${Date.now()}`,
      () => setSecili(new Set()),
    );
  };

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/30"
      >
        <Users className="size-4" />
        Hesabı Böl
      </button>
    );
  }

  const sekmeler: { id: Sekme; etiket: string }[] = [
    ...(adliGrup ? [{ id: 'kisi' as Sekme, etiket: 'Kişiye Göre' }] : []),
    { id: 'esit', etiket: 'Eşit Böl' },
    { id: 'urun', etiket: 'Ürün Seç' },
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4" />
          Hesabı Böl
        </div>
        <button
          type="button"
          onClick={() => setAcik(false)}
          className="text-xs text-muted-foreground"
        >
          Kapat
        </button>
      </div>

      {hata && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {hata}
        </p>
      )}

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

      {/* ─── Kişiye Göre ─────────────────────────────── */}
      {aktifSekme === 'kisi' && (
        <ul className="space-y-2">
          {kisiGruplari.map((grup) => {
            const anahtar = grup.ad ?? '__adsiz__';
            const odendi = odenenler.has(anahtar);
            return (
              <li
                key={anahtar}
                className={`rounded-lg border p-3 ${odendi ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium">
                      {grup.ad ?? 'Adsız'}
                    </p>
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {grup.kalemler.map((k, i) => (
                        <li key={i}>
                          <span className="tabular-nums">{k.adet}×</span>{' '}
                          {k.ad}
                          <span className="ml-1 tabular-nums">
                            {formatTL(k.araToplamKurus)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatTL(grup.toplam)}
                    </span>
                    {odendi ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <Check className="size-3" /> Ödeme alındı
                      </span>
                    ) : !grup.teslimEdildi ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> Teslim bekleniyor
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => kisiOde(grup)}
                        disabled={yukleniyor === anahtar}
                        className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {yukleniyor === anahtar ? '…' : 'Ödeme al'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ─── Eşit Böl ────────────────────────────────── */}
      {aktifSekme === 'esit' && (
        <div className="space-y-3">
          {!tumTeslimEdildi && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <Clock className="size-3 shrink-0" />
              {bekleyenSiparisler.length === 1
                ? '1 sipariş henüz teslim edilmedi.'
                : `${bekleyenSiparisler.length} sipariş henüz teslim edilmedi.`}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kişi sayısı</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setKisiSayisi((k) => Math.max(2, k - 1))}
                className="flex size-7 items-center justify-center rounded-full border"
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
              <span>{formatTL(toplamKurus)}</span>
            </div>
            <div className="flex justify-between font-medium mt-1">
              <span>Kişi başı</span>
              <span>{formatTL(kisiPayi)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {Array.from({ length: kisiSayisi }).map((_, i) => {
              const odendi = i < odenenSayisi;
              const aktif = tumTeslimEdildi && i === odenenSayisi;
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
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {yukleniyor ? '…' : 'Ödeme al'}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {!tumTeslimEdildi && i === 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> Teslim bekleniyor
                        </span>
                      ) : (
                        'bekliyor'
                      )}
                    </span>
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
          {bekleyenSiparisler.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <Clock className="size-3 shrink-0" />
              Teslim edilmemiş siparişlerin ürünleri seçilemiyor.
            </div>
          )}

          {teslimKalemler.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Henüz teslim edilmiş ürün yok.
            </p>
          ) : (
            <>
              <ul className="max-h-56 space-y-0.5 overflow-y-auto">
                {teslimSiparisler.map((s) => (
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
                    className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {yukleniyor ? '…' : 'Ödeme al'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

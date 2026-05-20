'use client';

import { useState } from 'react';
import { CheckCircle2, Minus, Plus, Users } from 'lucide-react';
import { formatTL } from '@/lib/utils/para';
import { anonGirisiSagla } from '@/lib/auth/anon';
import type { SiparisDurumu } from '@/types/model';

interface KalemOzet {
  ad: string;
  adet: number;
  araToplamKurus: number;
  urunId: string;
}

interface SiparisOzet {
  id: string;
  gunlukNo: number;
  durum: SiparisDurumu;
  kalemler: KalemOzet[];
}

interface Props {
  adisyonId: string;
  toplamKurus: number;
  siparisler: SiparisOzet[];
}

type Yontem = 'esit' | 'urun';
type Yukleme = 'idle' | 'bekliyor' | 'basarili' | 'hata';

export function AyriOdeme({ adisyonId, toplamKurus, siparisler }: Props) {
  const [acik, setAcik] = useState(false);
  const [yontem, setYontem] = useState<Yontem>('esit');
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [yukleme, setYukleme] = useState<Yukleme>('idle');
  const [hata, setHata] = useState<string | null>(null);
  const [odenenTutar, setOdenenTutar] = useState(0);

  const aktifSiparisler = siparisler.filter((s) => s.durum !== 'iptal');
  const tumKalemler = aktifSiparisler.flatMap((s) =>
    s.kalemler.map((k, i) => ({
      key: `${s.id}-${i}`,
      siparisId: s.id,
      siparisNo: s.gunlukNo,
      ad: k.ad,
      adet: k.adet,
      araToplamKurus: k.araToplamKurus,
    })),
  );

  const seciliToplam = Array.from(secili).reduce((acc, key) => {
    const item = tumKalemler.find((k) => k.key === key);
    return acc + (item?.araToplamKurus ?? 0);
  }, 0);

  const kisiPayi = Math.ceil(toplamKurus / kisiSayisi);
  const kalaniFarki = kisiPayi * kisiSayisi - toplamKurus;

  const toggleSecili = (key: string) => {
    setSecili((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const gonder = async () => {
    setYukleme('bekliyor');
    setHata(null);
    try {
      const user = await anonGirisiSagla();
      const idToken = await user.getIdToken();

      const body =
        yontem === 'esit'
          ? { yontem: 'esit', kisiSayisi }
          : {
              yontem: 'urun',
              secilenKalemler: Array.from(secili).map((key) => {
                const item = tumKalemler.find((k) => k.key === key)!;
                return {
                  siparisId: item.siparisId,
                  siparisNo: item.siparisNo,
                  ad: item.ad,
                  adet: item.adet,
                  araToplamKurus: item.araToplamKurus,
                };
              }),
            };

      const res = await fetch(`/api/adisyon/${adisyonId}/odeme-talebi`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Talep gönderilemedi.');
      }

      const result = (await res.json()) as {
        toplamKurus: number;
        kisiPayi?: number;
      };
      setOdenenTutar(result.kisiPayi ?? result.toplamKurus);
      setYukleme('basarili');
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata oluştu.');
      setYukleme('hata');
    }
  };

  if (yukleme === 'basarili') {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-600/30 bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
            Talebiniz kasiyere iletildi
          </p>
          <p className="mt-0.5 text-sm text-emerald-800 dark:text-emerald-300">
            Kasiyere{' '}
            <span className="font-semibold">{formatTL(odenenTutar)}</span>{' '}
            ödeyiniz.
          </p>
        </div>
      </div>
    );
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="w-full rounded-2xl border bg-card p-4 shadow-soft text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Payımı Ayır</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ayrı ödeme talep etmek için dokunun
        </p>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Payımı Ayır</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setAcik(false);
            setYukleme('idle');
            setHata(null);
          }}
          className="text-xs text-muted-foreground"
        >
          İptal
        </button>
      </div>

      {/* Yöntem seçici */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(['esit', 'urun'] as const).map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYontem(y)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              yontem === y
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {y === 'esit' ? 'Eşit Böl' : 'Ürün Seç'}
          </button>
        ))}
      </div>

      {/* İçerik */}
      {yontem === 'esit' ? (
        <div className="space-y-3">
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
              <span className="w-6 text-center font-medium tabular-nums">
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
          <div className="rounded-xl bg-muted/50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Toplam</span>
              <span>{formatTL(toplamKurus)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Kişi başı</span>
              <span>{formatTL(kisiPayi)}</span>
            </div>
            {kalaniFarki > 0 && (
              <p className="text-xs text-muted-foreground pt-0.5">
                * Kuruş farkı kasada düzenlenir.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tumKalemler.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Seçilebilir ürün yok.
            </p>
          ) : (
            <>
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {aktifSiparisler.map((s) => (
                  <li key={s.id}>
                    {aktifSiparisler.length > 1 && (
                      <p className="px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Sipariş #{s.gunlukNo}
                      </p>
                    )}
                    {s.kalemler.map((k, i) => {
                      const key = `${s.id}-${i}`;
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-muted/50"
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
                <div className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm font-medium">
                  <span>Seçilen toplam</span>
                  <span className="tabular-nums">{formatTL(seciliToplam)}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {yukleme === 'hata' && hata && (
        <p className="text-xs text-destructive">{hata}</p>
      )}

      <button
        type="button"
        onClick={gonder}
        disabled={
          yukleme === 'bekliyor' ||
          (yontem === 'urun' && secili.size === 0)
        }
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {yukleme === 'bekliyor' ? 'Gönderiliyor…' : 'Talep Gönder'}
      </button>
    </div>
  );
}

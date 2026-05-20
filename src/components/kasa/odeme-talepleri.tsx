'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTL } from '@/lib/utils/para';

interface TalepKalemi {
  siparisId: string;
  siparisNo: number;
  ad: string;
  adet: number;
  araToplamKurus: number;
}

interface TalepItem {
  id: string;
  yontem: 'esit' | 'urun';
  toplamKurus: number;
  kisiSayisi?: number;
  kisiPayi?: number;
  secilenKalemler?: TalepKalemi[];
  durum: 'bekliyor' | 'odendi' | 'iptal';
  musteriAd?: string;
  kaynak?: 'musteri' | 'kasiyer';
}

interface Props {
  adisyonId: string;
  talepler: TalepItem[];
}

const DURUM_STIL: Record<TalepItem['durum'], string> = {
  bekliyor:
    'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  odendi: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  iptal: 'bg-muted text-muted-foreground',
};

const DURUM_ETIKET: Record<TalepItem['durum'], string> = {
  bekliyor: 'Bekliyor',
  odendi: 'Ödendi',
  iptal: 'İptal',
};

function OdemeOnayla({
  adisyonId,
  talepId,
}: {
  adisyonId: string;
  talepId: string;
}) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  const onayla = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(
        `/api/adisyon/${adisyonId}/odeme-talebi/${talepId}/onayla`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setYukleniyor(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onayla}
      disabled={yukleniyor}
      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
    >
      {yukleniyor ? '…' : 'Ödeme al'}
    </button>
  );
}

export function OdemeTalepleri({ adisyonId, talepler }: Props) {
  if (talepler.length === 0) return null;

  const bekleyenSayisi = talepler.filter((t) => t.durum === 'bekliyor').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Ödeme Talepleri</h2>
        {bekleyenSayisi > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {bekleyenSayisi} bekliyor
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {talepler.map((t) => (
          <li key={t.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${DURUM_STIL[t.durum]}`}
                  >
                    {DURUM_ETIKET[t.durum]}
                  </span>
                  {t.musteriAd && (
                    <span className="text-xs font-medium">{t.musteriAd}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t.yontem === 'esit'
                      ? `Eşit böl — ${t.kisiSayisi} kişi`
                      : 'Ürün seçimi'}
                  </span>
                  {t.kaynak === 'musteri' && (
                    <span className="text-[10px] text-muted-foreground/70">
                      (müşteri talebi)
                    </span>
                  )}
                </div>

                {t.yontem === 'urun' && t.secilenKalemler && (
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {t.secilenKalemler.map((k, i) => (
                      <li key={i}>
                        <span className="tabular-nums">{k.adet}×</span> {k.ad}
                        <span className="ml-1 tabular-nums">
                          {formatTL(k.araToplamKurus)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-sm font-semibold tabular-nums">
                  {formatTL(t.kisiPayi ?? t.toplamKurus)}
                </span>
                {t.durum === 'bekliyor' && t.kaynak === 'musteri' && (
                  <OdemeOnayla adisyonId={adisyonId} talepId={t.id} />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatTL } from '@/lib/utils/para';
import { cn } from '@/lib/utils';
import type { Siparis, SiparisDurumu } from '@/types/model';

const SONRAKI: Partial<
  Record<SiparisDurumu, { etiket: string; durum: SiparisDurumu }>
> = {
  yeni: { etiket: 'Hazırlığa al', durum: 'hazirlaniyor' },
  hazirlaniyor: { etiket: 'Hazır', durum: 'hazir' },
  hazir: { etiket: 'Teslim et', durum: 'teslim' },
};

const saatFmt = (d: Date | undefined) =>
  d
    ? d.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export function SiparisKarti({ siparis }: { siparis: Siparis }) {
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const ilerlet = async (durum: SiparisDurumu) => {
    setCalisiyor(true);
    setHata(null);
    try {
      const res = await fetch(`/api/siparis/${siparis.id}/durum`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ durum, adisyonId: siparis.adisyonId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Güncelleme başarısız.');
      }
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    } finally {
      setCalisiyor(false);
    }
  };

  const sonraki = SONRAKI[siparis.durum];

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 space-y-2 shadow-sm',
        siparis.slaUyari && 'border-destructive/60 ring-1 ring-destructive/30',
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          Sipariş #{siparis.gunlukNo}
          {siparis.slaUyari && (
            <span
              title="SLA aşıldı"
              className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive"
            >
              <AlertTriangle className="size-3" />
              Geç
            </span>
          )}
        </span>
        <span>{saatFmt(siparis.olusturulduAt)}</span>
      </div>

      <ul className="space-y-1 text-sm">
        {siparis.kalemler.map((k, i) => (
          <li
            key={`${k.urunId}-${i}`}
            className="flex items-start justify-between gap-2"
          >
            <span className="min-w-0">
              <span className="tabular-nums text-muted-foreground">
                {k.adet}×
              </span>{' '}
              {k.ad}
              {k.notlar && (
                <span className="block text-xs text-muted-foreground">
                  Not: {k.notlar}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
              {formatTL(k.araToplamKurus)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">Toplam</span>
        <span className="font-semibold">{formatTL(siparis.toplamKurus)}</span>
      </div>

      {hata && <p className="text-xs text-destructive">{hata}</p>}

      <div className="flex gap-2 pt-1">
        {sonraki && (
          <button
            type="button"
            disabled={calisiyor}
            onClick={() => ilerlet(sonraki.durum)}
            className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {calisiyor ? '…' : sonraki.etiket}
          </button>
        )}
        {siparis.durum !== 'teslim' && siparis.durum !== 'iptal' && (
          <button
            type="button"
            disabled={calisiyor}
            onClick={() => {
              if (
                window.confirm(
                  'Bu siparişi iptal etmek istediğinize emin misiniz?',
                )
              ) {
                void ilerlet('iptal');
              }
            }}
            className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
          >
            İptal
          </button>
        )}
      </div>
    </div>
  );
}

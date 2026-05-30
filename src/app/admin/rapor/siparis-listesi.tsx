'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTL } from '@/lib/utils/para';
import { useOnay } from '@/components/ortak/onay-dialog';
import type { SiparisDurumu } from '@/types/model';

export interface RaporSiparis {
  adisyonId: string;
  siparisId: string;
  gunlukNo: number;
  masaAd: string;
  durum: SiparisDurumu;
  toplamKurus: number;
  saat: string;
  raporDisi: boolean;
  ozet: string;
}

const DURUM_ETIKET: Record<SiparisDurumu, string> = {
  yeni: 'Alındı',
  hazirlaniyor: 'Hazırlanıyor',
  hazir: 'Hazır',
  teslim: 'Teslim',
  iptal: 'İptal',
};

export function RaporSiparisListesi({
  siparisler,
}: {
  siparisler: RaporSiparis[];
}) {
  const router = useRouter();
  const onay = useOnay();
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);

  const degistir = async (s: RaporSiparis, haric: boolean) => {
    setYukleniyor(s.siparisId);
    try {
      const res = await fetch('/api/admin/siparis-rapor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          adisyonId: s.adisyonId,
          siparisId: s.siparisId,
          haric,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? `HTTP ${res.status}`);
      }
      toast.success(haric ? 'Sipariş rapordan çıkarıldı.' : 'Sipariş rapora geri eklendi.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'İşlem başarısız.');
    } finally {
      setYukleniyor(null);
    }
  };

  const sil = async (s: RaporSiparis) => {
    const ok = await onay({
      baslik: 'Siparişi tamamen sil',
      mesaj:
        `#${s.gunlukNo} (${s.masaAd}) siparişi KALICI olarak silinecek. ` +
        'Stok geri verilir; adisyonda başka sipariş kalmazsa adisyon da kapanır. ' +
        'Bu işlem geri alınamaz. Devam edilsin mi?',
      onayEtiket: 'Tamamen sil',
      tehlikeli: true,
    });
    if (!ok) return;
    setYukleniyor(s.siparisId);
    try {
      const res = await fetch('/api/admin/siparis-sil', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          adisyonId: s.adisyonId,
          siparisId: s.siparisId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? `HTTP ${res.status}`);
      }
      toast.success('Sipariş tamamen silindi.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Silme başarısız.');
    } finally {
      setYukleniyor(null);
    }
  };

  if (siparisler.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
        Bu tarihte sipariş yok.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {siparisler.map((s) => (
        <li
          key={s.siparisId}
          className={`flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2 text-sm ${
            s.raporDisi ? 'opacity-55' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">#{s.gunlukNo}</span>
              <span className="text-muted-foreground">{s.masaAd}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.saat}
              </span>
              <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {DURUM_ETIKET[s.durum]}
              </span>
              {s.raporDisi && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Rapor dışı
                </span>
              )}
            </div>
            <p
              className={`mt-0.5 line-clamp-2 text-xs text-muted-foreground ${
                s.raporDisi ? 'line-through' : ''
              }`}
            >
              {s.ozet || '—'}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-medium tabular-nums">
              {formatTL(s.toplamKurus)}
            </span>
            <div className="flex items-center gap-1">
              {s.raporDisi ? (
                <button
                  type="button"
                  onClick={() => void degistir(s, false)}
                  disabled={yukleniyor === s.siparisId}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-emerald-700 disabled:opacity-50 dark:text-emerald-400"
                >
                  <RotateCcw className="size-3" />
                  Geri ekle
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void degistir(s, true)}
                  disabled={yukleniyor === s.siparisId}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <EyeOff className="size-3" />
                  Rapordan çıkar
                </button>
              )}
              <button
                type="button"
                onClick={() => void sil(s)}
                disabled={yukleniyor === s.siparisId}
                aria-label="Tamamen sil"
                title="Tamamen sil"
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                Sil
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

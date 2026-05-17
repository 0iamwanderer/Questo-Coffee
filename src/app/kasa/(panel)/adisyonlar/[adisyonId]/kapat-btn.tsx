'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdisyonuKapatBtn({ adisyonId }: { adisyonId: string }) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kapat = async () => {
    if (!window.confirm('Adisyon kapatılsın mı? Geri alınamaz.')) return;
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch(`/api/adisyon/${adisyonId}/kapat`, {
        method: 'POST',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Kapatılamadı.');
      }
      router.replace('/kasa/adisyonlar');
      router.refresh();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      {hata && <p className="text-sm text-destructive">{hata}</p>}
      <button
        type="button"
        onClick={kapat}
        disabled={yukleniyor}
        className="w-full rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
      >
        {yukleniyor ? 'Kapatılıyor…' : 'Adisyonu kapat (ödeme alındı)'}
      </button>
    </div>
  );
}

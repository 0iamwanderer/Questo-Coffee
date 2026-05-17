'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AyarForm({ baslangic }: { baslangic: { ad: string } }) {
  const router = useRouter();
  const [ad, setAd] = useState(baslangic.ad);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    try {
      const res = await fetch('/api/admin/restoran', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ad: ad.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Kaydedilemedi.');
      }
      toast.success('Ayarlar güncellendi.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Hata');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <form onSubmit={kaydet} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-1.5">
        <label htmlFor="ad" className="text-sm font-medium">
          Restoran adı
        </label>
        <input
          id="ad"
          type="text"
          required
          maxLength={120}
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Müşterinin masada gördüğü restoran adı.
        </p>
      </div>
      <button
        type="submit"
        disabled={yukleniyor || !ad.trim()}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {yukleniyor ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </form>
  );
}

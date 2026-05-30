'use client';

import { useRouter } from 'next/navigation';

export interface GunSecenek {
  id: string; // yyyy-mm-dd
  ust: string; // "Bugün" / "Dün" / "Pzt"
  alt: string; // "28.05"
}

/**
 * Rapor gün gezgini — tarih seçici + son 7 gün hızlı butonları.
 * Gezinme `router.push` + `router.refresh()` ile yapılır; böylece Next router
 * cache eski içeriği göstermez ve seçili gün her zaman güncel veriyle yüklenir.
 */
export function RaporTarihGezgini({
  gunler,
  seciliTarih,
}: {
  gunler: GunSecenek[];
  seciliTarih: string;
}) {
  const router = useRouter();

  const git = (tarih: string) => {
    if (!tarih) return;
    router.push(`/admin/rapor?tarih=${tarih}`);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={seciliTarih}
          onChange={(e) => git(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>

      {/* Son 7 gün — hızlı erişim */}
      <div className="flex flex-wrap gap-1.5">
        {gunler.map((g) => {
          const secili = g.id === seciliTarih;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => git(g.id)}
              className={`flex min-w-16 flex-col items-center rounded-md border px-3 py-1.5 text-center text-xs transition ${
                secili
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-medium capitalize">{g.ust}</span>
              <span className="tabular-nums opacity-80">{g.alt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

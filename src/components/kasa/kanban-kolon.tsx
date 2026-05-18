'use client';

import type { Siparis, SiparisDurumu } from '@/types/model';
import { SiparisKarti } from './siparis-karti';

const RENK: Record<SiparisDurumu, string> = {
  yeni: 'border-blue-500/40',
  hazirlaniyor: 'border-amber-500/40',
  hazir: 'border-green-500/40',
  teslim: 'border-muted',
  iptal: 'border-destructive/40',
};

export function KanbanKolon({
  baslik,
  durum,
  siparisler,
  flashIds,
}: {
  baslik: string;
  durum: SiparisDurumu;
  siparisler: Siparis[];
  flashIds?: Set<string>;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{baslik}</h2>
        <span className="rounded-md border bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {siparisler.length}
        </span>
      </div>
      <ul className={`space-y-2 rounded-lg border-t-2 ${RENK[durum]} pt-3`}>
        {siparisler.length === 0 ? (
          <li className="rounded-lg border border-dashed bg-card/50 p-6 text-center text-xs text-muted-foreground">
            Boş
          </li>
        ) : (
          siparisler.map((s) => (
            <li key={s.id}>
              <SiparisKarti
                siparis={s}
                flash={flashIds?.has(s.id) ?? false}
              />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

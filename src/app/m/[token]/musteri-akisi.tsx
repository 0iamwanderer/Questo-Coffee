'use client';

import { MenuListesi } from '@/components/musteri/menu-listesi';
import { KvkkBildirim } from '@/components/musteri/kvkk-bildirim';
import { useMasa } from './masa-provider';

export function MusteriAkisi() {
  const { masaToken } = useMasa();

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <MenuListesi />
      <KvkkBildirim masaToken={masaToken} />
    </div>
  );
}

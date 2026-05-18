'use client';

import { useEffect, useState } from 'react';

/** HH:mm formatında canlı saat. 30 saniyede bir günceller. */
export function CanliSaat() {
  const [zaman, setZaman] = useState<string>('');

  useEffect(() => {
    const guncelle = () => {
      const d = new Date();
      setZaman(
        d.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    };
    guncelle();
    const t = setInterval(guncelle, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!zaman) return null;
  return <span className="tabular-nums">{zaman}</span>;
}

'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdisyonYenile() {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  const yenile = () => {
    setYukleniyor(true);
    router.refresh();
    setTimeout(() => setYukleniyor(false), 800);
  };

  return (
    <button
      type="button"
      onClick={yenile}
      disabled={yukleniyor}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft transition active:scale-95 disabled:opacity-50"
      aria-label="Yenile"
    >
      <RefreshCw
        className={`size-3.5 ${yukleniyor ? 'animate-spin' : ''}`}
      />
      Yenile
    </button>
  );
}
